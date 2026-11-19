import type { CameraType, LngLat } from '../../src/types/camera';
import type {
	OsmTestLog,
	TestQuery,
	TestQuerySummary,
	TestRequestLog,
} from '../../src/types/jobs';
import type { OverpassElement } from '../../src/types/osm';
import type { ReadyFile } from '../../src/types/readyFile';
import { isAuthorized } from '../_lib/auth.js';
import { blobPath, jobEnv, readJson, writeJson } from '../_lib/blob.js';
import { deadline, sleep } from '../_lib/budget.js';
import {
	COUNTRY_OVERPASS_BOX,
	GRID,
	PAUSE_MS,
	RUN_BUDGET_MS,
} from '../_lib/config.js';
import { askOverpass } from '../_lib/overpass.js';

// VXM-012 T1 - the OSM test job (D1, R0). Runs every night until T5 replaces it. Asks the
// five queries tile by tile for France, measures each answer and writes one log file per
// run to Blob (logs/osm-test-<time>.json). Nothing the app reads. What the logs show sets
// the real OSM job's tile size, time budget and retries, and VXM-014's scope.

const COUNTRY = 'FR';
// The official cameras, uploaded by hand (M5). Read-only, so it's read from the
// production path in every environment.
const SEED_PATH = 'data/fr.json';
// Where the next run starts: the pairs a run doesn't reach come first next time.
const STATE_PATH = 'logs/osm-test-state.json';

type Box = [number, number, number, number]; // south, west, north, east

const QUERIES: Record<TestQuery, (box: string, t: number) => string> = {
	// VXM-010's query: speed cameras with a direction, + the road for forward / backward
	directions: (box, t) => `[out:json][timeout:${t}];
node["highway"="speed_camera"]["direction"](${box})->.cams;
.cams out body;
node.cams["direction"~"forward|backward",i]->.relative;
way(bn.relative)["highway"];
out geom;`,
	// VXM-010's query: average-speed sections with their members
	sections: (box, t) => `[out:json][timeout:${t}];
rel["enforcement"="average_speed"](${box});
out geom;`,
	// New (VXM-014): the road under every speed camera - tags only, no geometry
	roads: (box, t) => `[out:json][timeout:${t}];
node["highway"="speed_camera"](${box})->.cams;
way(bn.cams)["highway"];
out tags;`,
	// New (VXM-014): red-light cameras, as relations or as tagged nodes
	redLight: (box, t) => `[out:json][timeout:${t}];
(
  rel["enforcement"="traffic_signals"](${box});
  node["enforcement"="traffic_signals"](${box});
);
out tags center;`,
	// New (VXM-014): level-crossing cameras, the same way
	levelCrossing: (box, t) => `[out:json][timeout:${t}];
(
  rel["enforcement"="level_crossing"](${box});
  node["enforcement"="level_crossing"](${box});
);
out tags center;`,
};

// Which official cameras each query is compared with, and how close counts as "near".
const NEAR: Partial<
	Record<TestQuery, { types: CameraType[]; metres: number }>
> = {
	directions: { types: ['speed', 'section'], metres: 50 },
	sections: { types: ['section'], metres: 300 },
	redLight: { types: ['red_light'], metres: 100 },
	levelCrossing: { types: ['level_crossing'], metres: 100 },
};

// Tags we may show later - counted to see how often they're filled.
const TAGS: Partial<Record<TestQuery, string[]>> = {
	directions: ['maxspeed', 'camera:type', 'check_date', 'survey:date'],
	roads: ['name', 'ref', 'tunnel', 'lanes', 'maxspeed', 'maxspeed:hgv'],
	redLight: ['check_date', 'survey:date'],
	levelCrossing: ['check_date', 'survey:date'],
};

const QUERY_NAMES = Object.keys(QUERIES) as TestQuery[];

function tiles([south, west, north, east]: Box): Box[] {
	const height = (north - south) / GRID;
	const width = (east - west) / GRID;
	const result: Box[] = [];
	for (let row = 0; row < GRID; row++) {
		for (let column = 0; column < GRID; column++) {
			result.push([
				south + row * height,
				west + column * width,
				south + (row + 1) * height,
				west + (column + 1) * width,
			]);
		}
	}
	return result;
}

// --- Official cameras: a small reader of the seeded file, only for this test. The app's
// normalizeFR() lives in src/, which the jobs may not be able to load (see the probe). ---

interface Official {
	type: CameraType;
	position: LngLat;
}

const FR_TYPES: Record<string, CameraType> = {
	ETFR: 'red_light',
	ETPN: 'level_crossing',
	ETVM: 'section',
};

function officialCameras(rows: Record<string, unknown>[]): Official[] {
	const result: Official[] = [];
	for (const raw of rows) {
		const row = Object.fromEntries(
			Object.entries(raw).map(([key, value]) => [key.trim(), value]),
		);
		const lat = parseFloat(String(row['Latitude']));
		const lng = parseFloat(String(row['Longitude']));
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
		result.push({
			type: FR_TYPES[String(row['Type de radar'])] ?? 'speed',
			position: [lng, lat],
		});
	}
	return result;
}

// --- Distances: official cameras in cells of ~1 km, so each OSM item checks only its
// neighbours ---

const CELL = 0.01; // degrees
const cellKey = (lng: number, lat: number) =>
	`${Math.floor(lng / CELL)}:${Math.floor(lat / CELL)}`;

function metres(a: LngLat, b: LngLat): number {
	const cosLat = Math.cos((a[1] * Math.PI) / 180);
	return Math.hypot(
		(b[0] - a[0]) * 111_320 * cosLat,
		(b[1] - a[1]) * 111_320,
	);
}

function nearChecker(
	officials: Official[],
	types: CameraType[],
	limit: number,
) {
	const cells = new Map<string, LngLat[]>();
	for (const camera of officials) {
		if (!types.includes(camera.type)) continue;
		const key = cellKey(...camera.position);
		cells.set(key, [...(cells.get(key) ?? []), camera.position]);
	}
	const reach = Math.ceil(limit / 1000) + 1; // cells to look at on each side
	return (point: LngLat) => {
		const column = Math.floor(point[0] / CELL);
		const row = Math.floor(point[1] / CELL);
		for (let dx = -reach; dx <= reach; dx++) {
			for (let dy = -reach; dy <= reach; dy++) {
				for (const other of cells.get(`${column + dx}:${row + dy}`) ??
					[]) {
					if (metres(point, other) <= limit) return true;
				}
			}
		}
		return false;
	};
}

// The points of an OSM element: a node's position, a relation's centre or its members.
function points(element: OverpassElement): LngLat[] {
	if (element.type === 'node') return [[element.lon, element.lat]];
	const center = (element as { center?: { lat: number; lon: number } })
		.center;
	if (center) return [[center.lon, center.lat]];
	if (element.type === 'relation') {
		return element.members
			.filter(
				member => member.lat !== undefined && member.lon !== undefined,
			)
			.map(member => [member.lon!, member.lat!] as LngLat);
	}
	return [];
}

// --- Can a job load the app's code from src/? (VXM-012 risk: @/ paths, no file
// extensions). Only logged - the run goes on either way. ---

async function probeSrcImports(): Promise<OsmTestLog['srcImports']> {
	try {
		const module = await import('../../src/lib/osm/matchCameras');
		return { ok: typeof module.matchCameraDirections === 'function' };
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function GET(request: Request): Promise<Response> {
	if (!isAuthorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}
	const started = Date.now();
	const { timeLeft } = deadline(RUN_BUDGET_MS);
	const log: OsmTestLog = {
		startedAt: new Date(started).toISOString(),
		finishedAt: '',
		totalMs: 0,
		env: jobEnv(),
		region: process.env.VERCEL_REGION ?? 'local',
		node: process.version,
		officialCameras: 0,
		srcImports: { ok: false },
		requests: [],
		skipped: 0,
		nextIndex: 0,
		summary: {},
	};

	try {
		log.srcImports = await probeSrcImports();

		const seed =
			await readJson<ReadyFile<Record<string, unknown>>>(SEED_PATH);
		if (!seed) throw new Error(`${SEED_PATH} not found in Blob (setup M5)`);
		const officials = officialCameras(seed.rows);
		log.officialCameras = officials.length;

		// Every query on every tile; tile by tile, so each query gets some tiles early
		const boxes = tiles(COUNTRY_OVERPASS_BOX[COUNTRY]!);
		const pairs = boxes.flatMap((_, tile) =>
			QUERY_NAMES.map(query => ({ query, tile })),
		);
		const state = await readJson<{ next: number }>(blobPath(STATE_PATH));
		const start = (state?.next ?? 0) % pairs.length;

		const found = new Map<TestQuery, Map<string, OverpassElement>>();
		let done = 0;
		for (; done < pairs.length; done++) {
			const { query, tile } = pairs[(start + done) % pairs.length];
			if (done > 0) await sleep(PAUSE_MS);
			const box = boxes[tile].map(value => value.toFixed(4)).join(',');
			const entry: TestRequestLog = {
				query,
				tile: tile + 1,
				startedAt: new Date().toISOString(),
				attempts: [],
			};
			const { answer, attempts } = await askOverpass(
				seconds => QUERIES[query](box, seconds),
				timeLeft,
			);
			entry.attempts = attempts;
			if (attempts.length === 0) break; // out of time before asking
			log.requests.push(entry);
			if (answer) {
				entry.items = answer.elements.length;
				const seen =
					found.get(query) ?? new Map<string, OverpassElement>();
				for (const element of answer.elements) {
					seen.set(`${element.type}/${element.id}`, element);
				}
				found.set(query, seen);
			}
			if (timeLeft() <= 0) {
				done++;
				break;
			}
		}
		log.skipped = pairs.length - done;
		log.nextIndex = (start + done) % pairs.length;

		// Per query: how many items, how many near an official camera, which tags are filled
		for (const query of QUERY_NAMES) {
			const requests = log.requests.filter(
				entry => entry.query === query,
			);
			if (requests.length === 0) continue;
			const elements = [...(found.get(query)?.values() ?? [])];
			const summary: TestQuerySummary = {
				requests: requests.length,
				answered: requests.filter(entry => entry.items !== undefined)
					.length,
				items: elements.length,
			};
			const near = NEAR[query];
			if (near) {
				const isNear = nearChecker(officials, near.types, near.metres);
				const counted =
					query === 'directions'
						? elements.filter(element => element.type === 'node') // not the roads
						: elements;
				summary.nearOfficial = counted.filter(element =>
					points(element).some(isNear),
				).length;
				summary.officialOfType = officials.filter(camera =>
					near.types.includes(camera.type),
				).length;
			}
			const tags = TAGS[query];
			if (tags) {
				const tagged =
					query === 'roads'
						? elements
						: elements.filter(element => element.type !== 'way');
				summary.tags = Object.fromEntries(
					tags.map(tag => [
						tag,
						tagged.filter(
							element => element.tags?.[tag] !== undefined,
						).length,
					]),
				);
			}
			log.summary[query] = summary;
		}

		await writeJson(blobPath(STATE_PATH), { next: log.nextIndex });
	} catch (error) {
		log.error = error instanceof Error ? error.message : String(error);
	}

	log.finishedAt = new Date().toISOString();
	log.totalMs = Date.now() - started;
	const stamp = log.startedAt.replace(/[:.]/g, '-');
	try {
		await writeJson(blobPath(`logs/osm-test-${stamp}.json`), log);
	} catch (error) {
		log.error = `${log.error ?? ''} log not written: ${error instanceof Error ? error.message : String(error)}`;
	}

	// The answer of a run by hand: the short version of the log
	const { requests, ...short } = log;
	return Response.json(
		{ ...short, requests: requests.length },
		{ status: log.error ? 500 : 200 },
	);
}
