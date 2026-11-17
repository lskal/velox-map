import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { COUNTRY_OSM } from '@/config/osm';
import { toFRResult } from '@/lib/fetchers/fr';
import { fetchJSON } from '@/lib/fetchers/helpers';
import { matchCameraDirections } from '@/lib/osm/matchCameras';
import { matchSectionPaths } from '@/lib/osm/sectionPath';
import type { RawFR } from '@/types/fr';
import type {
	OsmExtrasFile,
	OverpassElement,
	OverpassResponse,
} from '@/types/osm';
import type { ReadyFile } from '@/types/readyFile';
import { runScript } from './runScript';
import { writeDataFile } from './writeDataFile';

// npm run osm:fr - the French OSM extras (VXM-010 R3-R5): reads the official cameras from
// public/data/fr.json (npm run data:fr), asks Overpass for the OSM speed cameras and
// average-speed sections, matches them (src/lib/osm/) and writes public/data/osm-fr.json.
// Moves into a scheduled job in VXM-012; only writeDataFile() changes then.

const settings = COUNTRY_OSM.FR!;
// Public Overpass servers, tried in this order (OSM wiki → Overpass API → Public
// Overpass API instances). kumi.systems is now private.coffee - the same servers - so
// it's not listed twice; other public instances were left out on purpose (Max,
// 2026-11-17). The first one that answers is used again for the next tile.
const SERVERS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.private.coffee/api/interpreter', // was overpass.kumi.systems
];
let serverIndex = 0;
const USER_AGENT = 'velox-map (+https://github.com/lskal/velox-map)';
// The box is cut into GRID x GRID tiles, asked one at a time: small queries the busy
// public servers can answer (2026-11-17: one big query got 502 / 504 from both).
// The box goes on each statement, not as a global [bbox:…] setting, which would cut
// the returned road geometry at the tile edge.
const GRID = 3;
const PAUSE_MS = 1_000; // between tiles, to be gentle with a shared server

type Box = [number, number, number, number]; // south, west, north, east

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

// Only what the matching reads (2026-11-17, Max: "ask for the minimum"): speed cameras
// that HAVE a direction, and road ways only for the few whose direction is "forward" /
// "backward" (needed to turn those into degrees) - not every camera's road.
const camerasQuery = (box: Box) => `[out:json][timeout:120];
node["highway"="speed_camera"]["direction"](${box.join(',')})->.cams;
.cams out body;
node.cams["direction"~"forward|backward",i]->.relative;
way(bn.relative)["highway"];
out geom;`;

// Average-speed sections with their members' positions and road pieces.
const sectionsQuery = (box: Box) => `[out:json][timeout:120];
rel["enforcement"="average_speed"](${box.join(',')});
out geom;`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Each tile's answer is saved for a day (node_modules/.cache, never committed), so a run
// that fails halfway can be started again and only asks the missing tiles - kinder to the
// servers too (2026-11-17: tile 7 timed out on all three).
const CACHE_DIR = path.resolve('node_modules/.cache/velox-map/overpass');
const CACHE_HOURS = 24;

async function readCache(file: string): Promise<OverpassResponse | null> {
	try {
		const { mtimeMs } = await stat(file);
		if (Date.now() - mtimeMs > CACHE_HOURS * 3_600_000) return null;
		return JSON.parse(await readFile(file, 'utf8')) as OverpassResponse;
	} catch {
		return null;
	}
}

// Every tile, one after the other; an element found in two tiles is kept once. A tile
// that fails on every server is skipped and returned in `failed`; the tiles that worked
// stay in the cache for the next run.
async function overpassByTiles(
	label: string,
	query: (box: Box) => string,
): Promise<{ answer: OverpassResponse; failed: number[] }> {
	await mkdir(CACHE_DIR, { recursive: true });
	const seen = new Map<string, OverpassElement>();
	const boxes = tiles(settings.overpassBox);
	const failed: number[] = [];
	for (const [index, box] of boxes.entries()) {
		const name = `${index + 1} of ${boxes.length}`;
		const file = path.join(
			CACHE_DIR,
			`${label.replace(/\W+/g, '-')}-${box.map(value => value.toFixed(3)).join('_')}.json`,
		);
		let answer = await readCache(file);
		if (answer) {
			console.log(`OSM: ${label} - tile ${name} (saved earlier)`);
		} else {
			console.log(`OSM: ${label} - tile ${name}`);
			try {
				answer = await overpass(query(box));
				await writeFile(file, JSON.stringify(answer));
			} catch (error) {
				const reason =
					error instanceof Error ? error.message : String(error);
				console.warn(`OSM: ${label} - tile ${name} failed (${reason})`);
				failed.push(index + 1);
				continue;
			}
			if (index < boxes.length - 1) await sleep(PAUSE_MS);
		}
		for (const element of answer.elements) {
			seen.set(`${element.type}/${element.id}`, element);
		}
	}
	return { answer: { elements: [...seen.values()] }, failed };
}

// One query: the current server (with the usual retries); if it still fails, the next
// server, and so on. A server that worked stays first for the next tiles.
async function overpass(query: string): Promise<OverpassResponse> {
	const options = {
		method: 'POST' as const,
		body: new URLSearchParams({ data: query }),
		headers: { 'User-Agent': USER_AGENT },
		timeoutMs: 150_000, // the query itself may take up to 120 s
	};
	for (let tried = 0; ; tried++) {
		const server = SERVERS[serverIndex];
		try {
			return await fetchJSON<OverpassResponse>(server, options);
		} catch (error) {
			if (tried === SERVERS.length - 1) throw error;
			const reason =
				error instanceof Error ? error.message : String(error);
			serverIndex = (serverIndex + 1) % SERVERS.length;
			console.warn(
				`OSM: ${new URL(server).host} failed (${reason}), trying ${new URL(SERVERS[serverIndex]).host}`,
			);
		}
	}
}

async function readOfficial() {
	const file = path.resolve('public/data/fr.json');
	let text: string;
	try {
		text = await readFile(file, 'utf8');
	} catch {
		throw new Error(`${file} is missing - run npm run data:fr first`);
	}
	const ready = JSON.parse(text) as ReadyFile<RawFR>;
	return toFRResult(ready).cameras;
}

async function main() {
	const cameras = await readOfficial();
	console.log(`OSM: ${cameras.length} official French cameras read`);

	const cameraTiles = await overpassByTiles('speed cameras', camerasQuery);
	const sectionTiles = await overpassByTiles('sections', sectionsQuery);
	const failed = [
		...cameraTiles.failed.map(tile => `speed cameras ${tile}`),
		...sectionTiles.failed.map(tile => `sections ${tile}`),
	];
	// Locally a partial file is still useful, so it's written, marked with the missing
	// tiles (Max, 2026-11-17). The scheduled job (VXM-012) keeps the stricter rule: write
	// only when complete, else the previous file stays.
	if (failed.length > 0) {
		console.warn(
			`OSM: tiles failed on every server: ${failed.join(', ')} - writing a PARTIAL file; run npm run osm:fr again later, the other tiles are saved`,
		);
	}
	const camerasAnswer = cameraTiles.answer;
	const sectionsAnswer = sectionTiles.answer;

	const cameraMatch = matchCameraDirections(
		cameras,
		camerasAnswer.elements,
		settings,
	);
	const sectionMatch = matchSectionPaths(
		cameras,
		sectionsAnswer.elements,
		settings,
	);

	const file: OsmExtrasFile = {
		source: '© OpenStreetMap contributors',
		licence: 'ODbL 1.0',
		generatedAt: new Date().toISOString(),
		country: 'FR',
		counts: { cameras: cameraMatch.counts, sections: sectionMatch.counts },
		directions: cameraMatch.directions,
		sections: sectionMatch.sections,
		...(failed.length > 0 && { missingTiles: failed }),
	};
	const name = settings.fileUrl.split('/').pop()!;
	const target = await writeDataFile(name, file);

	const osmCameras = camerasAnswer.elements.filter(
		element => element.type === 'node',
	).length;
	const { cameras: c, sections: s } = file.counts;
	console.log(
		`OSM: ${osmCameras} OSM speed cameras with a direction in the box`,
	);
	console.log(
		`OSM: cameras - ${c.withDirection} of ${c.cameras} got a direction (${c.unreadable} unreadable values)`,
	);
	console.log(
		`OSM: sections - ${s.withPath} of ${s.sections} got a path; ${s.notJoined} with a relation whose pieces don't join; ${s.noRelation} with no relation within ${settings.sectionMatchMetres} m`,
	);
	console.log(`OSM: written → ${target}`);
}

runScript('OSM', main);
