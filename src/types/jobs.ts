// Scheduled jobs (VXM-012): the status file every job writes (T2), the OSM job's log (T5).

// Where a job runs: Vercel's VERCEL_ENV; anything else (local) counts as development.
export type JobEnv = 'production' | 'preview' | 'development';

// A job's status file, data/status-<name>.json (VXM-012 D2, R10c), written at the end of
// every run, success or not. The alert workflow reads it through /data/ (D9).
export interface JobStatus {
	job: string; // "fr", "osm-fr"
	lastTry: string; // ISO - this run
	lastSuccess: string | null; // ISO - the last run that wrote a new file; null = never
	ok: boolean; // this run's result
	error?: string; // why this run failed
	failedCheck?: JobCheck; // which check failed
	missing?: string[]; // what's still missing (OSM: query + tile pairs)
	counts?: Record<string, number>; // the numbers the checks used: new and previous
}

// The checks a job runs before writing (VXM-012 R3, R6b): empty file, row count ≠ the
// source's total, more than ±25 % change, duplicate ids, points outside the country.
export type JobCheck = 'empty' | 'total' | 'change' | 'unique' | 'bounds';

// What a run hands to writeStatus(): success with its counts, or why it failed.
export type JobResult =
	| { ok: true; counts?: Record<string, number> }
	| {
			ok: false;
			error: string;
			failedCheck?: JobCheck;
			missing?: string[];
			counts?: Record<string, number>;
	  };

// One try on one Overpass server.
export interface OverpassAttempt {
	server: string; // host, e.g. "overpass-api.de"
	ms: number;
	outcome: 'ok' | 'timeout' | 'error' | number; // a number = the HTTP status
	kb?: number; // size of the answer
	error?: string; // network error or Overpass's own "remark"
	cause?: string; // what's behind a network error: ECONNRESET, UND_ERR_CONNECT_TIMEOUT…
}

// The OSM job's queries (VXM-012 D6): directions and sections feed osm-fr.json (what the
// app reads); red light and roads are collected into osm-fr-more.json (not served yet).
export type OsmQuery = 'directions' | 'sections' | 'redLight' | 'roads';

// One query on one tile, with every server it tried.
export interface OsmRequestLog {
	query: OsmQuery;
	tile: number; // 1-9
	attempts: OverpassAttempt[];
	items?: number; // elements in the answer, when a server answered
}

// The log the OSM job writes to Blob after every run that had work to do (logs/osm-fr-<time>.json)
// - read together after the first nights, then only kept for failed runs (D6).
export interface OsmJobLog {
	startedAt: string;
	finishedAt: string;
	totalMs: number;
	env: JobEnv;
	pairsDone: number; // query + tile pairs in the partial set, after this run
	pairsTotal: number;
	requests: OsmRequestLog[];
	result: 'incomplete' | 'written' | 'check failed' | 'error';
	error?: string;
}

// What publish() did with a checked file (VXM-013 R1, R4).
export type PublishResult = 'changed' | 'unchanged';

// The first check a job's new file failed, and why (VXM-012 D2).
export interface JobCheckFailure {
	check: JobCheck;
	error: string;
}

// A box on the map: south, west, north, east (the OSM job's tiles).
export type Box = [number, number, number, number];
