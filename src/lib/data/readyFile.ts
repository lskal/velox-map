import type { ReadyFile } from '@/types/data';

// Reads a ready data file (VXM-010 R3b; served from Blob since VXM-012). Missing or not
// usable → null, and the caller decides (France: the error card). The dev server answers a
// missing file with the page's HTML, not a 404, so the content type is checked too.
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
