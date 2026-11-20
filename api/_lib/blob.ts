import { get, put } from '@vercel/blob';
import type { JobEnv } from '../../src/types/jobs';

// Reading and writing JSON in the private Blob store (VXM-012 D2). The functions sign in
// with OIDC (BLOB_STORE_ID, added when the store was connected) - no token needed.

export function jobEnv(): JobEnv {
	const env = process.env.VERCEL_ENV;
	return env === 'production' || env === 'preview' ? env : 'development';
}

// Production writes to "data/…", "logs/…"; preview and local runs to "preview/data/…",
// "preview/logs/…" - so a job tested on develop never overwrites what main serves (D11).
export function blobPath(path: string): string {
	return jobEnv() === 'production' ? path : `preview/${path}`;
}

// The file's JSON, or null when it doesn't exist. Always the latest version (no cache).
export async function readJson<T>(pathname: string): Promise<T | null> {
	const result = await get(pathname, { access: 'private', useCache: false });
	if (!result || result.statusCode !== 200 || !result.stream) return null;
	return (await new Response(result.stream).json()) as T;
}

// The file as a stream, for passing it on unchanged (the /data/ function, D3), or null
// when it doesn't exist.
export async function openFile(
	pathname: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
	const result = await get(pathname, { access: 'private', useCache: false });
	if (!result || result.statusCode !== 200 || !result.stream) return null;
	return { stream: result.stream, contentType: result.blob.contentType };
}

// Creates or replaces the file. A short cache time, so a new version shows within minutes.
export async function writeJson(
	pathname: string,
	data: unknown,
): Promise<void> {
	await put(pathname, JSON.stringify(data), {
		access: 'private',
		addRandomSuffix: false,
		allowOverwrite: true,
		contentType: 'application/json',
		cacheControlMaxAge: 60,
	});
}
