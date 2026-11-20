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
