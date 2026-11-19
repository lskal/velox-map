// Scheduled jobs (VXM-012). T1: the test job's log; the status file and the rest come
// with T2.

// Where a job runs: Vercel's VERCEL_ENV; anything else (local) counts as development.
export type JobEnv = 'production' | 'preview' | 'development';

// One try on one Overpass server.
export interface OverpassAttempt {
	server: string; // host, e.g. "overpass-api.de"
	ms: number;
	outcome: 'ok' | 'timeout' | 'error' | number; // a number = the HTTP status
	kb?: number; // size of the answer
	error?: string; // network error or Overpass's own "remark"
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
