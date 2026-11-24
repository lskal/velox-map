import type { OsmExtrasFile } from '@/types/osm';

// Loads a country's OSM file (VXM-010 D5, R8): once per page - the file stays in this
// module for the page's life, so turning the switch off and on again doesn't fetch.
// The promise is kept, not only the file (VXM-012 D7): the background prefetch and the
// switch share one request, even when the switch is turned on while the prefetch is still
// loading. A failed load is dropped, so the next "on" tries again.
const files = new Map<string, Promise<OsmExtrasFile>>();

// Throws when the file is missing or not usable; the switch shows the error card.
// No retry here: the user can turn the switch on again later.
export function loadOsmFile(url: string): Promise<OsmExtrasFile> {
	const kept = files.get(url);
	if (kept) return kept;

	const loading = fetchOsmFile(url);
	files.set(url, loading);
	loading.catch(() => files.delete(url));
	return loading;
}

const fetchOsmFile = async (url: string): Promise<OsmExtrasFile> => {
	const response = await fetch(url);
	// The dev server answers a missing file with the page's HTML and status 200, so the
	// content type is checked too (same as loadReadyFile).
	const type = response.headers.get('content-type') ?? '';
	if (!response.ok || !type.includes('json')) {
		throw new Error(`OSM file not found: ${url} (${response.status})`);
	}
	const file = (await response.json()) as OsmExtrasFile;
	if (!isObject(file.directions) || !isObject(file.sections)) {
		throw new Error(`OSM file not usable: ${url}`);
	}
	return file;
};

function isObject(value: unknown): boolean {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
