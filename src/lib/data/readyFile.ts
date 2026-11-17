import type { ReadyFile } from '@/types/readyFile';

// Reads a ready data file (VXM-010 R3b). Missing or not usable → null, and the caller
// falls back to the live source. No retry: a missing file is normal (deployed site,
// fresh clone). The dev server answers a missing file with the page's HTML, not a 404,
// so the content type is checked too.
export async function loadReadyFile<Row>(
	url: string,
): Promise<ReadyFile<Row> | null> {
	try {
		const response = await fetch(url);
		const type = response.headers.get('content-type') ?? '';
		if (!response.ok || !type.includes('json')) return null;
		const file = (await response.json()) as ReadyFile<Row>;
		return Array.isArray(file.rows) && file.rows.length > 0 ? file : null;
	} catch {
		return null;
	}
}
