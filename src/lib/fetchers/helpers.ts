import type { FetchJSONOptions } from '@/types/data';

// Helpers shared by the country fetchers (data-sources.md → Shared helpers).

// Some APIs put stray spaces in their keys ("VMA ", " Longitude") - trim them.
// T = the row shape you expect after trimming, e.g. trimKeys<TrimmedFR>(raw).
export function trimKeys<T>(raw: Record<string, unknown>): T {
	return Object.fromEntries(
		Object.entries(raw).map(([key, value]) => [key.trim(), value]),
	) as T;
}

// "+45.361" → 45.361; a number stays a number; anything else → NaN (check with Number.isNaN).
export function toNumber(value: unknown): number {
	return typeof value === 'number' ? value : parseFloat(String(value ?? ''));
}

// A request that came back with an error status. 4xx = our request is wrong, don't retry.
export class HttpError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

const TIMEOUT_MS = 20_000;
const RETRY_WAITS_MS = [2_000, 5_000]; // plan.md → Data flow: up to 2 retries, 2 s then 5 s

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// A request + JSON with the retry rule of plan.md → Data flow (2026-11-13): a timeout, a
// network error or a 5xx is tried again up to 2 times; a 4xx is not. Used by the app and
// by the scheduled jobs (VXM-012).
export async function fetchJSON<T>(
	url: string,
	options: FetchJSONOptions = {},
): Promise<T> {
	const { timeoutMs = TIMEOUT_MS, ...init } = options;
	for (let attempt = 0; ; attempt++) {
		// Our own timer, not AbortSignal.timeout(): that one doesn't keep Node running,
		// so a job waiting on a stuck request could end silently (2026-11-17).
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetch(url, {
				...init,
				signal: controller.signal,
			});
			if (!response.ok) {
				throw new HttpError(
					response.status,
					`${response.status} ${response.statusText} - ${url}`,
				);
			}
			return (await response.json()) as T;
		} catch (error) {
			const retryable =
				!(error instanceof HttpError) || error.status >= 500;
			const wait = RETRY_WAITS_MS[attempt];
			if (!retryable || wait === undefined) throw error;
			const reason =
				error instanceof HttpError
					? error.status
					: error instanceof Error
						? error.name
						: 'error';
			console.warn(
				`Request failed (${reason}), trying again in ${wait / 1000} s - ${url}`,
			);
			await sleep(wait);
		} finally {
			clearTimeout(timer);
		}
	}
}
