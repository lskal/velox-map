import { jobEnv, openFile } from '../_lib/blob.js';
import { SERVED_CACHE_SECONDS, SERVED_FILES } from '../_lib/config.js';

// VXM-012 T4 (D3, R7) - serves the ready data files from the private Blob store at
// /data/<file> (vercel.json rewrites /data/:file here). The app's URLs don't change, the
// store's address is never public, and Vercel's CDN keeps each answer for an hour.
// Only names in SERVED_FILES; everything else answers 404.
// On a preview, a file the preview's own jobs wrote (preview/data/…) comes first, else the
// production one - read-only, so a preview can never change what production serves (D11).

export async function GET(request: Request): Promise<Response> {
	const name = new URL(request.url).pathname.split('/').pop() ?? '';
	if (!SERVED_FILES.includes(name)) {
		return new Response('Not found', { status: 404 });
	}

	const paths =
		jobEnv() === 'production'
			? [`data/${name}`]
			: [`preview/data/${name}`, `data/${name}`];
	try {
		for (const path of paths) {
			const file = await openFile(path);
			if (!file) continue;
			return new Response(file.stream, {
				headers: {
					'Content-Type': file.contentType,
					'Cache-Control': `public, s-maxage=${SERVED_CACHE_SECONDS}, stale-while-revalidate=86400`,
					// Which copy answered - handy when checking a preview
					'X-Velox-File': path,
				},
			});
		}
		return new Response('Not found', { status: 404 });
	} catch (error) {
		// Blob not reachable: don't let the CDN keep the error
		console.error(`/data/${name}:`, error);
		return new Response('Data not available', {
			status: 503,
			headers: { 'Cache-Control': 'no-store' },
		});
	}
}
