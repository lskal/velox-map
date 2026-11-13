import type { Camera } from '@/types/camera';

// Where a country's data is (VXM-007): still loading, failed, or ready.
export type DataStatus = 'loading' | 'error' | 'ready';

export interface CountryData {
	status: DataStatus;
	cameras: Camera[];
	dataAsOf: string | null; // the file's date, null until loaded
}
