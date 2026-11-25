import type { Camera } from '@/types/camera';

// Where a country's data is (VXM-007): still loading, failed, or ready.
export type DataStatus = 'loading' | 'error' | 'ready';

export interface CountryData {
	status: DataStatus;
	cameras: Camera[];
	dataAsOf: string | null; // the file's date, null until loaded
	fetchedAt: string | null; // when the job wrote the file (the stale line), null until loaded
}

// --- Ready data file ---

// A ready data file (VXM-010 D2): what the scheduled jobs write to Vercel Blob (VXM-012).
// The source's rows as they arrived - normalising stays in the app (plan.md → Data flow).

export interface DataSource {
	name: string;
	url: string;
	licence: string;
}

export interface ReadyFile<Row> {
	source: DataSource;
	fetchedAt: string; // when the job fetched it (ISO)
	dataAsOf: string; // the source's own date
	total: number; // rows the source says it has
	rows: Row[];
}

// --- Fetching ---

// Optional request settings for fetchJSON() (lib/fetchers/helpers.ts): a POST body
// (Overpass), headers, a longer timeout.
export interface FetchJSONOptions {
	method?: 'GET' | 'POST';
	body?: string | URLSearchParams;
	headers?: Record<string, string>;
	timeoutMs?: number; // default 20 s
}
