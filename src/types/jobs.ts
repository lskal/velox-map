// Scheduled jobs (VXM-012). T1: the test job's log; T2: the status file every job writes.

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

// The five queries the test job measures (VXM-012 D1).
export type TestQuery =
	'directions' | 'sections' | 'roads' | 'redLight' | 'levelCrossing';

// One query on one tile, with every server it tried.
export interface TestRequestLog {
	query: TestQuery;
	tile: number; // 1-9
	startedAt: string; // ISO
	attempts: OverpassAttempt[];
	items?: number; // elements in the answer, when one server answered
}

// Per query, over the tiles this run reached.
export interface TestQuerySummary {
	requests: number;
	answered: number;
	items: number; // OSM elements, each counted once
	nearOfficial?: number; // of those, how many lie near an official camera of the matching type
	officialOfType?: number; // official cameras of the matching type
	tags?: Record<string, number>; // how many elements have each tag we may use later
}

// The file the test job writes to Blob, one per run.
export interface OsmTestLog {
	startedAt: string;
	finishedAt: string;
	totalMs: number;
	env: JobEnv;
	region: string; // VERCEL_REGION, e.g. "fra1"
	node: string; // Node version
	officialCameras: number; // read from the seeded data/fr.json
	srcImports: { ok: boolean; error?: string }; // can a job load the app's code from src/?
	requests: TestRequestLog[];
	skipped: number; // query + tile pairs not reached in this run
	nextIndex: number; // where the next run starts
	summary: Partial<Record<TestQuery, TestQuerySummary>>;
	error?: string; // the run stopped on an unexpected error
}
