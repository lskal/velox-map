import type { Camera, CameraType } from '@/types/camera';
import { DATA_FILES } from '@/config/data';
import { loadReadyFile } from '@/lib/data/readyFile';
import type {
	DataGouvDataset,
	DataGouvResource,
	FetchFRResult,
	FRSource,
	RawFR,
	SkippedFR,
	TabularPage,
	TrimmedFR,
} from '@/types/fr';
import type { DataSource } from '@/types/readyFile';
import { fetchJSON, toNumber, trimKeys } from './helpers';

// France - fixed radars from data.gouv.fr (data-sources.md → France).
// Two steps (VXM-010 D2): fetchFRSource() gets the rows as they are - used by the local
// script now and the daily job later (VXM-012) - and toFRResult() normalises them in the
// app. loadFR() is the app's way in: the ready file when there is one, else the live source.

export const FR_SOURCE: DataSource = {
	name: "Ministère de l'Intérieur - data.gouv.fr",
	url: 'https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/',
	licence: 'Licence Ouverte 2.0',
};

const DATASET_URL =
	'https://www.data.gouv.fr/api/1/datasets/liste-des-radars-fixes-en-france/';
const TABULAR_URL = 'https://tabular-api.data.gouv.fr/api/resources';
const PAGE_SIZE = 200; // the tabular API's maximum

// The file changes every year: take the newest CSV marked 'main' (D2).
async function findNewestFile(): Promise<DataGouvResource> {
	const dataset = await fetchJSON<DataGouvDataset>(DATASET_URL);
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

// Page 1 → total → pages 2..N, one at a time: gentler on a slow server than 17 requests
// at once (2026-11-17: parallel pages kept failing). Each page is retried (fetchJSON); a
// page that still fails fails everything (VXM-005 D3).
async function fetchAllRows(resourceId: string) {
	const first = await fetchJSON<TabularPage<RawFR>>(pageUrl(resourceId, 1));
	const total = first.meta.total;
	const pages = Math.ceil(total / PAGE_SIZE);

	const rows = [...first.data];
	for (let page = 2; page <= pages; page++) {
		const next = await fetchJSON<TabularPage<RawFR>>(
			pageUrl(resourceId, page),
		);
		rows.push(...next.data);
	}
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

// The rows as the source gives them, plus its date - no normalising.
export async function fetchFRSource(): Promise<FRSource> {
	const file = await findNewestFile();
	const { total, rows } = await fetchAllRows(file.id);
	return { fileTitle: file.title, dataAsOf: file.last_modified, total, rows };
}

// Rows → cameras, keeping the rows that couldn't be used and why.
export function toFRResult({
	dataAsOf,
	total,
	rows,
}: Pick<FRSource, 'dataAsOf' | 'total' | 'rows'>): FetchFRResult {
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
	return { dataAsOf, total, rowsFetched: rows.length, cameras, skipped };
}

// Straight from data.gouv.fr (VXM-005).
export async function fetchFR(): Promise<FetchFRResult> {
	return toFRResult(await fetchFRSource());
}

// The app's way in (VXM-010 R3b): the ready file (public/data/fr.json, written by
// `npm run data:fr`) when there is one, else the live source as before - so the deployed
// site keeps working until the scheduled job exists (VXM-012).
export async function loadFR(): Promise<FetchFRResult> {
	const file = await loadReadyFile<RawFR>(DATA_FILES.FR);
	if (file) {
		console.info(
			`France: ready file from ${file.fetchedAt.slice(0, 10)} (${file.rows.length} rows)`,
		);
		return toFRResult(file);
	}
	console.info('France: no ready file, using the live source');
	return fetchFR();
}
