import type {
	DataGouvDataset,
	DataGouvResource,
	RawFR,
	TabularPage,
} from '@/types/fr';

// France - fixed radars from data.gouv.fr (data-sources.md → France).
// Fetched from the browser for now (VXM-005); the daily job will reuse this later.

const DATASET_URL =
	'https://www.data.gouv.fr/api/1/datasets/liste-des-radars-fixes-en-france/';
const TABULAR_URL = 'https://tabular-api.data.gouv.fr/api/resources';
const PAGE_SIZE = 200; // the tabular API's maximum

async function getJSON<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`France: ${response.status} ${response.statusText} - ${url}`,
		);
	}
	return response.json() as Promise<T>;
}

// The file changes every year: take the newest CSV marked 'main' (D2).
async function findNewestFile(): Promise<DataGouvResource> {
	const dataset = await getJSON<DataGouvDataset>(DATASET_URL);
	const newest = dataset.resources
		.filter(
			resource => resource.format === 'csv' && resource.type === 'main',
		)
		.sort((a, b) => b.last_modified.localeCompare(a.last_modified))[0];

	if (!newest) {
		throw new Error('France: no CSV file found in the dataset');
	}
	if (!newest.extras['analysis:parsing:finished_at']) {
		// No raw-CSV fallback in VXM-005 (spec → Out of scope).
		throw new Error(
			`France: "${newest.title}" is not ready in the tabular API yet`,
		);
	}
	return newest;
}

function pageUrl(resourceId: string, page: number): string {
	return `${TABULAR_URL}/${resourceId}/data/?page=${page}&page_size=${PAGE_SIZE}`;
}

// Page 1 → total → pages 2..N in parallel. One failed page fails everything (D3).
async function fetchAllRows(resourceId: string) {
	const first = await getJSON<TabularPage<RawFR>>(pageUrl(resourceId, 1));
	const total = first.meta.total;
	const pages = Math.ceil(total / PAGE_SIZE);

	const rest = await Promise.all(
		Array.from({ length: pages - 1 }, (_, i) =>
			getJSON<TabularPage<RawFR>>(pageUrl(resourceId, i + 2)),
		),
	);

	const rows = [first, ...rest].flatMap(page => page.data);
	return { total, rows };
}

export async function fetchFR() {
	const file = await findNewestFile();
	const { total, rows } = await fetchAllRows(file.id);

	return {
		resource: {
			id: file.id,
			title: file.title,
			lastModified: file.last_modified,
		},
		dataAsOf: file.last_modified,
		total,
		rowsFetched: rows.length,
		rows,
	};
}
