// Optional request settings for fetchJSON() (lib/fetchers/helpers.ts): a POST body
// (Overpass), headers, a longer timeout.
export interface FetchJSONOptions {
	method?: 'GET' | 'POST';
	body?: string | URLSearchParams;
	headers?: Record<string, string>;
	timeoutMs?: number; // default 20 s
}
