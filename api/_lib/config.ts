import type { CountryCode } from '../../src/types/map';

// Settings for the scheduled jobs (VXM-012). The jobs can load src/ when its value
// imports are relative .js paths (D12); these may move to src/config/jobs.ts later.

// Overpass servers, tried in this order (VXM-012 R6; Max, 2026-11-20):
// - api.overpass.ch: standard Overpass API with a free plan (10,000 requests a month, 30 a
//   minute, 1 at a time, queries up to 60 s; busy → 503). Built for API use, so it goes
//   first and spares the community servers. The key is a Vercel env var (keyEnv), sent as
//   the X-API-Key header - never in the code (their fair-use rules). No key set → skipped
// - ovp.dresel.systems: Overpass Europe, free, no key, 4 parallel queries per IP
// - overpass-api.de: the main community server; refused us after 2-3 heavy queries in a
//   row (test runs 2026-11-19/20)
// Removed (2026-11-23): overpass.private.coffee (= kumi.systems) - no answer in T1, nor
// within 120 s on 2026-11-23.
// Left out: overpass.osm.jp (gone), overpass.osm.ch (Switzerland only), the Russian
// instances. If every server fails, the previous OSM file stays and the next run tries again.
// timeoutMs: how long one request may wait on that server - 60 s is overpass.ch's own
// limit; a tile takes 39-47 s on overpass-api.de (T1) and 26 s on dresel for the
// heaviest one (2026-11-23), so 75 s is enough.
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
];

export const USER_AGENT = 'velox-map (+https://github.com/lskal/velox-map)';

// A Vercel run lasts at most 300 s on Hobby (vercel.json → maxDuration). No new request
// starts after RUN_BUDGET_MS; the rest is left for matching and writing to Blob.
export const RUN_BUDGET_MS = 280_000;
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
// Between two requests: overpass.ch allows 30 requests a minute, so at least 2 s.
export const PAUSE_MS = 2_000;

// The OSM job (D6): the country's box (COUNTRY_OSM.<country>.overpassBox) is cut into
// GRID x GRID tiles; each tile is also limited to the country by an area filter.
export const GRID = 3;
// The OSM job does nothing when the current file is younger than this: the first run of
// the night wrote it, the other runs stop at once.
export const OSM_FRESH_HOURS = 12;
// Answers collected for the next file are dropped after this many days.
export const OSM_PARTIAL_DAYS = 7;

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
