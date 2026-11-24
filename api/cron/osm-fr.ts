import type { RawFR } from '../../src/types/fr';
import type {
	Box,
	JobCheckFailure,
	OsmJobLog,
	OsmPartialAnswer,
	OsmPartialFile,
	OsmQuery,
	OsmRequestLog,
	PublishResult,
} from '../../src/types/jobs';
import type {
	OsmExtrasFile,
	OsmMoreFile,
	OsmTags,
	OverpassElement,
	OverpassNode,
	OverpassWay,
} from '../../src/types/osm';
import type { ReadyFile } from '../../src/types/readyFile';
import { isAuthorized } from '../_lib/auth.js';
import {
	blobPath,
	deleteFile,
	jobEnv,
	readJson,
	writeJson,
} from '../_lib/blob.js';
import { deadline, sleep } from '../_lib/budget.js';
import {
	currentPath,
	publish,
	readCurrent,
	withinChange,
} from '../_lib/checks.js';
import {
	GRID,
	OSM_FRESH_HOURS,
	OSM_PARTIAL_DAYS,
	PAUSE_MS,
	RUN_BUDGET_MS,
} from '../_lib/config.js';
import { askOverpass } from '../_lib/overpass.js';
import { writeStatus } from '../_lib/status.js';
import { COUNTRY_OSM } from '../../src/config/osm.js';
import { toFRResult } from '../../src/lib/fetchers/fr.js';
import { matchCameraDirections } from '../../src/lib/osm/matchCameras.js';
import { matchSectionPaths } from '../../src/lib/osm/sectionPath.js';

// VXM-012 T5 (D6; R6, R6b, R6c) - the French OSM job. Runs every 20 minutes from 03:00 to
// 05:00 on Tuesday and Thursday nights (vercel.json → schedules). Small requests: four
// queries x 9 tiles, each tile limited to France by an area filter. The answers stay in
// memory; only a run that can't finish writes them to one partial file
// (work/osm-fr/partial.json, VXM-013 R2), and the next run asks only what's missing. When
// all 36 are there: merge → the VXM-010 matching → ±25 % checks → osm-fr.json (what the
// app reads) + osm-fr-more.json (red light and roads, collected for the card ticket, not
// served yet), each copied only when its data changed (R1). A log only when the run
// wasn't clean (R3). A run that finds a file younger than 12 hours stops.
// ?accept=1 skips the ±25 % checks; ?force=1 runs even when the file is fresh. Both need
// the secret, like every run.

const COUNTRY = 'FR';
const JOB = 'osm-fr';
const MORE = 'osm-fr-more';
const settings = COUNTRY_OSM[COUNTRY]!;

// Left out when comparing with the current files: it changes on every run (VXM-013 R1).
const IGNORE = ['generatedAt'];

// The area filter: only what lies inside the country (T1: the box alone reached into
// Spain, Switzerland, Italy, Belgium and Germany).
const AREA = `area["ISO3166-1"="${COUNTRY}"][admin_level=2]->.country;`;

const QUERIES: Record<OsmQuery, (box: string, t: number) => string> = {
	// VXM-010's query: speed cameras with a direction, + the road for forward / backward
	directions: (box, t) => `[out:json][timeout:${t}];
${AREA}
node["highway"="speed_camera"]["direction"](${box})(area.country)->.cams;
.cams out body;
node.cams["direction"~"forward|backward",i]->.relative;
way(bn.relative)["highway"];
out geom;`,
	// VXM-010's query: average-speed sections with their members
	sections: (box, t) => `[out:json][timeout:${t}];
${AREA}
rel["enforcement"="average_speed"](${box})(area.country);
out geom;`,
	// Red-light cameras, as relations (their centre) or as tagged nodes
	redLight: (box, t) => `[out:json][timeout:${t}];
${AREA}
(
  rel["enforcement"="traffic_signals"](${box})(area.country);
  node["enforcement"="traffic_signals"](${box})(area.country);
);
out tags center;`,
	// Every speed camera and the road it sits on: tags and node list, no geometry
	roads: (box, t) => `[out:json][timeout:${t}];
${AREA}
node["highway"="speed_camera"](${box})(area.country)->.cams;
.cams out body;
way(bn.cams)["highway"];
out body;`,
};
const QUERY_NAMES = Object.keys(QUERIES) as OsmQuery[];

// The tags worth keeping in osm-fr-more.json (T1: which ones are filled).
const CAMERA_TAGS = ['maxspeed', 'maxspeed:hgv', 'direction', 'camera:type'];
const ROAD_TAGS = [
	'name',
	'ref',
	'lanes',
	'maxspeed',
	'maxspeed:hgv',
	'tunnel',
];

const tiles = ([south, west, north, east]: Box): Box[] => {
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
};

// --- The answers collected for the next file ---

const partialPath = () => blobPath(`work/${JOB}/partial.json`);

// An answer counts for the next file when it's newer than the current file and not
// older than OSM_PARTIAL_DAYS. So a new file makes all of them old at once.
const stillValid = (answer: OsmPartialAnswer, since: number): boolean => {
	const time = Date.parse(answer.fetchedAt);
	return time > since && Date.now() - time < OSM_PARTIAL_DAYS * 86_400_000;
};

// Clean = every request answered by the first server on the first try, and the file
// written (changed or not). Anything else goes in the log (VXM-013 D4).
const isClean = (log: OsmJobLog): boolean =>
	log.result === 'written' &&
	log.requests.every(
		({ attempts }) => attempts.length === 1 && attempts[0].outcome === 'ok',
	);

// --- From the merged answers to the two files ---

const pick = (tags: OsmTags | undefined, keys: string[]): OsmTags => {
	const result: OsmTags = {};
	for (const key of keys) {
		if (tags?.[key] !== undefined) result[key] = tags[key];
	}
	return result;
};

const buildMore = (
	redLight: OverpassElement[],
	roads: OverpassElement[],
	generatedAt: string,
): OsmMoreFile => {
	const cameras = roads.filter(
		(element): element is OverpassNode => element.type === 'node',
	);
	const ways = roads.filter(
		(element): element is OverpassWay => element.type === 'way',
	);
	const roadOf = new Map<number, OsmTags>();
	for (const way of ways) {
		for (const node of way.nodes ?? []) {
			if (!roadOf.has(node)) roadOf.set(node, pick(way.tags, ROAD_TAGS));
		}
	}
	const redLightItems = redLight.flatMap(element => {
		const point =
			element.type === 'node'
				? { lat: element.lat, lon: element.lon }
				: (element as { center?: { lat: number; lon: number } }).center;
		return point
			? [
					{
						id: `${element.type}/${element.id}`,
						...point,
						tags: element.tags ?? {},
					},
				]
			: [];
	});
	const cameraItems = cameras.map(camera => ({
		id: camera.id,
		lat: camera.lat,
		lon: camera.lon,
		tags: pick(camera.tags, CAMERA_TAGS),
		...(roadOf.has(camera.id) && { road: roadOf.get(camera.id) }),
	}));
	return {
		source: '© OpenStreetMap contributors',
		licence: 'ODbL 1.0',
		generatedAt,
		country: COUNTRY,
		counts: {
			redLight: redLightItems.length,
			cameras: cameraItems.length,
			camerasWithRoad: cameraItems.filter(camera => camera.road).length,
		},
		redLight: redLightItems,
		cameras: cameraItems,
	};
};

// The ±25 % checks (R6b), on the numbers users see and the ones collected.
const changeCheck = (
	extras: OsmExtrasFile,
	more: OsmMoreFile,
	current: OsmExtrasFile | null,
	currentMore: OsmMoreFile | null,
): JobCheckFailure | null => {
	const pairs: [string, number, number | null][] = [
		[
			'directions',
			extras.counts.cameras.withDirection,
			current?.counts.cameras.withDirection ?? null,
		],
		[
			'section paths',
			extras.counts.sections.withPath,
			current?.counts.sections.withPath ?? null,
		],
		[
			'red-light cameras',
			more.counts.redLight,
			currentMore?.counts.redLight ?? null,
		],
		[
			'speed cameras',
			more.counts.cameras,
			currentMore?.counts.cameras ?? null,
		],
	];
	for (const [label, value, previous] of pairs) {
		if (!withinChange(value, previous)) {
			return {
				check: 'change',
				error: `${label}: ${value}, the current file has ${previous} - more than ±25 % (run with ?accept=1 if the change is real)`,
			};
		}
	}
	return null;
};

export async function GET(request: Request): Promise<Response> {
	if (!isAuthorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}
	const params = new URL(request.url).searchParams;
	const accept = params.get('accept') === '1';
	const force = params.get('force') === '1';

	// Fresh enough (an earlier run tonight wrote it) → nothing to do, no log, no status
	const own = await readJson<OsmExtrasFile>(currentPath(JOB));
	const ownTime = own ? Date.parse(own.generatedAt) : 0;
	if (!force && Date.now() - ownTime < OSM_FRESH_HOURS * 3_600_000) {
		return Response.json({
			job: JOB,
			skipped: 'fresh',
			generatedAt: own?.generatedAt,
		});
	}

	const started = Date.now();
	const { timeLeft } = deadline(RUN_BUDGET_MS);
	const boxes = tiles(settings.overpassBox);
	const pairs = QUERY_NAMES.flatMap(query =>
		boxes.map((_, index) => ({ query, tile: index + 1 })),
	);
	const log: OsmJobLog = {
		startedAt: new Date(started).toISOString(),
		finishedAt: '',
		totalMs: 0,
		env: jobEnv(),
		pairsDone: 0,
		pairsTotal: pairs.length,
		requests: [],
		result: 'incomplete',
	};
	let httpStatus = 202;
	let published: PublishResult | undefined;

	try {
		// The answers an earlier run couldn't finish with: one file, read once (D3)
		const answers = new Map<string, OsmPartialAnswer>();
		const partial = await readJson<OsmPartialFile>(partialPath());
		for (const [key, saved] of Object.entries(partial?.answers ?? {})) {
			if (stillValid(saved, ownTime)) answers.set(key, saved);
		}
		let asked = 0;

		// Ask what's missing, one request at a time. A request no server answers ends the
		// run: the servers rest, the next run asks again.
		for (const { query, tile } of pairs) {
			if (answers.has(`${query}-${tile}`)) continue;
			if (log.requests.length > 0) await sleep(PAUSE_MS);
			const box = boxes[tile - 1]
				.map(value => value.toFixed(4))
				.join(',');
			const { answer, attempts } = await askOverpass(
				seconds => QUERIES[query](box, seconds),
				timeLeft,
			);
			if (attempts.length === 0) break; // out of time before asking
			const entry: OsmRequestLog = { query, tile, attempts };
			log.requests.push(entry);
			if (!answer) break;
			entry.items = answer.elements.length;
			answers.set(`${query}-${tile}`, {
				fetchedAt: new Date().toISOString(),
				elements: answer.elements,
			});
			asked++;
		}
		log.pairsDone = answers.size;

		if (answers.size < pairs.length) {
			// Can't finish: keep what's there for the next run (only when something new came in)
			if (asked > 0) {
				await writeJson(partialPath(), {
					answers: Object.fromEntries(answers),
				} satisfies OsmPartialFile);
			}
			const missing = pairs
				.filter(({ query, tile }) => !answers.has(`${query}-${tile}`))
				.map(({ query, tile }) => `${query} ${tile}`);
			await writeStatus(JOB, {
				ok: false,
				error: `${missing.length} of ${pairs.length} requests still missing - the next run goes on`,
				missing,
			});
		} else {
			// All there: the partial file isn't needed any more
			if (partial) await deleteFile(partialPath()).catch(() => {});

			// Merge each query's tiles (an element on two tiles counts once)
			const merged = (query: OsmQuery) => {
				const seen = new Map<string, OverpassElement>();
				for (let tile = 1; tile <= boxes.length; tile++) {
					for (const element of answers.get(`${query}-${tile}`)
						?.elements ?? []) {
						seen.set(`${element.type}/${element.id}`, element);
					}
				}
				return [...seen.values()];
			};

			const official = await readCurrent<ReadyFile<RawFR>>('fr');
			if (!official)
				throw new Error('fr.json not found - the French job writes it');
			const cameras = toFRResult(official).cameras;
			const cameraMatch = matchCameraDirections(
				cameras,
				merged('directions'),
				settings,
			);
			const sectionMatch = matchSectionPaths(
				cameras,
				merged('sections'),
				settings,
			);
			const generatedAt = new Date().toISOString();
			const extras: OsmExtrasFile = {
				source: '© OpenStreetMap contributors',
				licence: 'ODbL 1.0',
				generatedAt,
				country: COUNTRY,
				counts: {
					cameras: cameraMatch.counts,
					sections: sectionMatch.counts,
				},
				directions: cameraMatch.directions,
				sections: sectionMatch.sections,
			};
			const more = buildMore(
				merged('redLight'),
				merged('roads'),
				generatedAt,
			);

			const current = await readCurrent<OsmExtrasFile>(JOB);
			const currentMore = await readCurrent<OsmMoreFile>(MORE);
			const counts = {
				directions: extras.counts.cameras.withDirection,
				sectionPaths: extras.counts.sections.withPath,
				redLight: more.counts.redLight,
				cameras: more.counts.cameras,
				camerasWithRoad: more.counts.camerasWithRoad,
			};
			const failure = accept
				? null
				: changeCheck(extras, more, current, currentMore);
			if (failure) {
				await writeStatus(JOB, {
					ok: false,
					error: failure.error,
					failedCheck: failure.check,
					counts,
				});
				log.result = 'check failed';
				httpStatus = 422;
			} else {
				const extrasResult = await publish(
					JOB,
					extras,
					current,
					IGNORE,
				);
				const moreResult = await publish(
					MORE,
					more,
					currentMore,
					IGNORE,
				);
				published =
					extrasResult === 'changed' || moreResult === 'changed'
						? 'changed'
						: 'unchanged';
				await writeStatus(JOB, { ok: true, counts });
				log.result = 'written';
				log.published = published;
				httpStatus = 200;
			}
		}
	} catch (error) {
		log.error = error instanceof Error ? error.message : String(error);
		log.result = 'error';
		httpStatus = 500;
		await writeStatus(JOB, { ok: false, error: log.error }).catch(() => {});
	}

	log.finishedAt = new Date().toISOString();
	log.totalMs = Date.now() - started;
	const logged = !isClean(log);
	if (logged) {
		const stamp = log.startedAt.replace(/[:.]/g, '-');
		await writeJson(blobPath(`logs/${JOB}-${stamp}.json`), log).catch(
			() => {},
		);
	}

	// The answer of a run by hand: the log without the request details, plus what was
	// published and whether a log was written (VXM-013 R4)
	const { requests, ...short } = log;
	return Response.json(
		{
			...short,
			requests: requests.length,
			accepted: accept,
			published,
			logged,
		},
		{ status: httpStatus },
	);
}
