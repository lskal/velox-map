import type { Camera } from '@/types/camera';

// France source - data.gouv.fr (data-sources.md → France). Only the fields we read.

// GET https://www.data.gouv.fr/api/1/datasets/liste-des-radars-fixes-en-france/
export interface DataGouvResource {
	id: string;
	title: string;
	format: string; // 'csv'
	type: string; // 'main' for the real files
	last_modified: string; // ISO date - our "data as of"
	extras: Record<string, unknown>; // 'analysis:parsing:finished_at' = tabular API ready
}

export interface DataGouvDataset {
	resources: DataGouvResource[];
}

// GET https://tabular-api.data.gouv.fr/api/resources/{id}/data/?page=N&page_size=200
export interface TabularPage<Row> {
	data: Row[];
	meta: { page: number; page_size: number; total: number };
}

// One raw row, keys as they arrive (with the stray spaces in "VMA " and " Longitude").
export type RawFR = Record<string, unknown>;

// One raw row after trimming the keys.
export interface TrimmedFR {
	__id?: number;
	'Numéro de radar'?: string | number;
	'Type de radar'?: string;
	'Date de mise en service'?: string;
	VMA?: number | null;
	Latitude?: string | number;
	Longitude?: string | number;
}

// A row normalizeFR() couldn't turn into a camera, and why.
export interface SkippedFR {
	radarNumber?: string;
	reason: string;
	row: TrimmedFR;
}

// What fetchFR() returns (VXM-005 plan D6).
export interface FetchFRResult {
	resource: { id: string; title: string; lastModified: string };
	dataAsOf: string;
	total: number; // rows the API says the file has
	rowsFetched: number; // rows that actually arrived
	cameras: Camera[];
	skipped: SkippedFR[];
}
