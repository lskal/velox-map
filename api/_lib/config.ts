import type { CountryCode } from '../../src/types/map';

// Settings for the scheduled jobs (VXM-012). Here and not in src/config/ for now: Vercel
// doesn't resolve the @/ paths in api/ functions, and src/ uses them everywhere. T1's
// probe (osm-test.ts) shows whether src/ can be loaded at all; after that, these may
// move to src/config/jobs.ts.

// Public Overpass servers, tried in this order (VXM-012 R6). kumi.systems = private.coffee;
// overpass.osm.ch is Switzerland only; the Russian instances are left out (Max, 2026-11-19).
// overpass.osm.jp is a public test instance - the last resort.
export const OVERPASS_SERVERS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.private.coffee/api/interpreter',
	'https://overpass.osm.jp/api/interpreter',
];

export const USER_AGENT = 'velox-map (+https://github.com/lskal/velox-map)';

// A Vercel run lasts at most 300 s on Hobby (vercel.json → maxDuration). No new request
// starts after RUN_BUDGET_MS; the rest is left for counting and writing to Blob.
export const RUN_BUDGET_MS = 240_000;
// One request waits at most this long, and never past the budget.
export const REQUEST_MAX_MS = 90_000;
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
