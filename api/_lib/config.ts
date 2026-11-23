import type { CountryCode } from '../../src/types/map';

// Settings for the scheduled jobs (VXM-012). Here and not in src/config/ for now: Vercel
// doesn't resolve the @/ paths in api/ functions, and src/ uses them everywhere. T1's
// probe (osm-test.ts) shows whether src/ can be loaded at all; after that, these may
// move to src/config/jobs.ts.

// Overpass servers, tried in this order (VXM-012 R6; Max, 2026-11-20):
// - api.overpass.ch: standard Overpass API with a free plan (10,000 requests a month, 30 a
//   minute, 1 at a time, queries up to 60 s; busy → 503). Built for API use, so it goes
//   first and spares the community servers. The key is a Vercel env var (keyEnv), sent as
//   the X-API-Key header - never in the code (their fair-use rules). No key set → skipped
// - ovp.dresel.systems: Overpass Europe, free, no key, 4 parallel queries per IP
// - overpass-api.de: the main community server; refused us after 2-3 heavy queries in a
//   row (test runs 2026-11-19/20)
// - overpass.private.coffee (= kumi.systems): never answered in those runs, so it gets
//   little time
// Left out: overpass.osm.jp (gone), overpass.osm.ch (Switzerland only), the Russian
// instances. If every server fails, the previous OSM file stays and the next run tries again.
// timeoutMs: how long one request may wait on that server.
export const OVERPASS_SERVERS: {
	url: string;
	timeoutMs: number;
	keyEnv?: string;
}[] = [
	{
		url: 'https://api.overpass.ch/v1/interpreter',
		timeoutMs: 60_000,
		keyEnv: 'OVERPASS_CH_KEY',
	},
	{ url: 'https://ovp.dresel.systems/api/interpreter', timeoutMs: 75_000 },
	{ url: 'https://overpass-api.de/api/interpreter', timeoutMs: 75_000 },
	{
		url: 'https://overpass.private.coffee/api/interpreter',
		timeoutMs: 30_000,
	},
];

export const USER_AGENT = 'velox-map (+https://github.com/lskal/velox-map)';

// A Vercel run lasts at most 300 s on Hobby (vercel.json → maxDuration). No new request
// starts after RUN_BUDGET_MS; the rest is left for counting and writing to Blob.
export const RUN_BUDGET_MS = 240_000;
// At most this many requests per run, then stop: overpass-api.de refused us after 2-3
// heavy queries in a row (test runs 2026-11-19/20), so each run asks a little and the
// server rests until the next run (every 20 minutes, vercel.json).
export const REQUESTS_PER_RUN = 2;
// Files the /data/ function serves (VXM-012 D3): only these names, never the previous,
// partial or log files. The status files are served for the alert workflow (D9).
export const SERVED_FILES = [
	'fr.json',
	'osm-fr.json',
	'status-fr.json',
	'status-osm-fr.json',
];
// How long Vercel's CDN keeps a served file: Blob is read about once an hour per file,
// not once per visitor. The data changes daily (official) or weekly (OSM).
export const SERVED_CACHE_SECONDS = 3600;

// The sanity check (VXM-012 R3, R6b): a new file's counts may differ from the current
// file's by at most this share, up or down (Max, 2026-11-19). A bigger change is never
// published on its own: the current file stays, the status says why, the alert fires.
export const MAX_CHANGE = 0.25;

// Less time left than this: don't start a request at all.
export const REQUEST_MIN_MS = 10_000;
// Between two requests, to be gentle with shared servers.
export const PAUSE_MS = 1_000;

// Where to ask Overpass, per country: [south, west, north, east], cut into GRID x GRID
// tiles. A copy of COUNTRY_OSM.FR.overpassBox (src/config/osm.ts) until the jobs can
// read src/ (see above).
export const COUNTRY_OVERPASS_BOX: Partial<
	Record<CountryCode, [number, number, number, number]>
> = {
	FR: [41.3, -5.2, 51.1, 9.6],
};
export const GRID = 3;

// Where a country's points may lie, for the job's "every point inside" check (VXM-012
// R3): [south, west, north, east] boxes, a little larger than the land. France: the
// metropolitan box + the overseas departments in the official file (Guadeloupe,
// Martinique, French Guiana, La Réunion - seen in VXM-007) + Mayotte, in case it's added.
export const COUNTRY_BOXES: Partial<
	Record<CountryCode, [number, number, number, number][]>
> = {
	FR: [
		[41.3, -5.2, 51.1, 9.6], // metropolitan France + Corsica
		[15.8, -61.9, 16.6, -60.9], // Guadeloupe
		[14.3, -61.3, 15.0, -60.7], // Martinique
		[2.0, -54.7, 5.9, -51.5], // French Guiana
		[-21.5, 55.1, -20.8, 55.9], // La Réunion
		[-13.1, 44.9, -12.5, 45.4], // Mayotte
	],
};
