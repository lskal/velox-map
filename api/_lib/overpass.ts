import type { OverpassAttempt } from '../../src/types/jobs';
import type { OverpassResponse } from '../../src/types/osm';
import { OVERPASS_SERVERS, REQUEST_MIN_MS, USER_AGENT } from './config.js';

// One Overpass query (VXM-012 D2, R6): the servers in order, always from the first, one
// try each - no waiting retries, the run's time is short. A 400 is our query's fault, so
// the other servers aren't tried.

const host = (url: string) => new URL(url).host;

// The real reason behind Node's "fetch failed": refused, reset, timed out… (error.cause)
function reason(error: unknown): string | undefined {
	const cause = (error as { cause?: { code?: string; message?: string } })
		.cause;
	return cause?.code ?? cause?.message;
}

export async function askOverpass(
	query: (timeoutSeconds: number) => string,
	timeLeft: () => number,
): Promise<{ answer: OverpassResponse | null; attempts: OverpassAttempt[] }> {
	const attempts: OverpassAttempt[] = [];
	for (const { url: server, timeoutMs, keyEnv } of OVERPASS_SERVERS) {
		const key = keyEnv ? process.env[keyEnv] : undefined;
		if (keyEnv && !key) continue; // its key isn't set: skip this server
		const budget = Math.min(timeoutMs, timeLeft());
		if (budget < REQUEST_MIN_MS) break;
		const started = Date.now();
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), budget);
		try {
			const response = await fetch(server, {
				method: 'POST',
				// The query's own timeout is a bit shorter than ours, so Overpass can answer
				// "timed out" instead of us cutting the connection
				body: new URLSearchParams({
					data: query(Math.max(5, Math.floor(budget / 1000) - 5)),
				}),
				headers: {
					'User-Agent': USER_AGENT,
					...(key && { 'X-API-Key': key }),
				},
				signal: controller.signal,
			});
			const text = await response.text();
			const ms = Date.now() - started;
			const kb = Math.round(text.length / 1024);
			if (!response.ok) {
				attempts.push({
					server: host(server),
					ms,
					outcome: response.status,
					kb,
				});
				if (response.status === 400) break;
				continue;
			}
			const answer = JSON.parse(text) as OverpassResponse & {
				remark?: string;
			};
			// Overpass answers 200 with a "remark" when the query ran out of time or memory
			if (answer.remark && /error/i.test(answer.remark)) {
				attempts.push({
					server: host(server),
					ms,
					outcome: 'error',
					kb,
					error: answer.remark,
				});
				continue;
			}
			attempts.push({
				server: host(server),
				ms,
				outcome: 'ok',
				kb,
			});
			return { answer, attempts };
		} catch (error) {
			attempts.push({
				server: host(server),
				ms: Date.now() - started,
				outcome: controller.signal.aborted ? 'timeout' : 'error',
				error: error instanceof Error ? error.message : String(error),
				cause: reason(error),
			});
		} finally {
			clearTimeout(timer);
		}
	}
	return { answer: null, attempts };
}
