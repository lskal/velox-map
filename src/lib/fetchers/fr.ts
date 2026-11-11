import type { Camera, CameraType } from '@/types/camera';
import type {
	DataGouvDataset,
	DataGouvResource,
	FetchFRResult,
	RawFR,
	SkippedFR,
	TabularPage,
	TrimmedFR,
} from '@/types/fr';
import { toNumber, trimKeys } from './helpers';

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

// French radar type codes → our camera type. Meanings from the dataset description on
// data.gouv.fr (data-sources.md → France → Type codes):
//   ETF  - classic fixed speed radar                                        → speed
//   ETD  - "discriminant" speed radar: tells trucks and cars apart          → speed
//   ETT  - new-generation "tower" radar: speed, can also catch red lights   → speed
//   ETU  - new-generation urban radar: speed, can also catch red lights     → speed
//   ETVM - average speed between two points (one point per row in the file) → section
//   ETFR - red light ("franchissement de feu rouge")                        → red_light
//   ETPN - level crossing ("passage à niveau")                              → level_crossing
// Any other code → speed.
const FR_TYPE: Record<string, CameraType> = {
	ETVM: 'section',
	ETFR: 'red_light',
	ETPN: 'level_crossing',
};

// One row → one Camera, or the reason it was left out (D4, spec R3-R5).
export function normalizeFR(raw: RawFR): Camera | SkippedFR {
	const row = trimKeys<TrimmedFR>(raw);
	const radarNumber = String(row['Numéro de radar'] ?? '').trim();
	const lat = toNumber(row.Latitude);
	const lng = toNumber(row.Longitude);

	if (!radarNumber) {
		return { reason: 'no radar number', row };
	}
	if (Number.isNaN(lat) || Number.isNaN(lng)) {
		return {
			radarNumber,
			reason: 'latitude or longitude is not a number',
			row,
		};
	}

	const code = String(row['Type de radar'] ?? '').trim();
	const date = row['Date de mise en service'];

	return {
		id: `FR-${radarNumber}`,
		origin: 'official',
		type: FR_TYPE[code] ?? 'speed',
		position: [lng, lat],
		precision: 'exact',
		details: {
			country: 'FR',
			radarType: code,
			limitKph: typeof row.VMA === 'number' ? row.VMA : undefined,
			commissionedAt:
				typeof date === 'string' ? date.slice(0, 10) : undefined,
		},
	};
}

export async function fetchFR(): Promise<FetchFRResult> {
	const file = await findNewestFile();
	const { total, rows } = await fetchAllRows(file.id);

	const cameras: Camera[] = [];
	const skipped: SkippedFR[] = [];
	for (const row of rows) {
		const result = normalizeFR(row);
		if ('reason' in result) {
			skipped.push(result);
		} else {
			cameras.push(result);
		}
	}

	return {
		resource: {
			id: file.id,
			title: file.title,
			lastModified: file.last_modified,
		},
		dataAsOf: file.last_modified,
		total,
		rowsFetched: rows.length,
		cameras,
		skipped,
	};
}
