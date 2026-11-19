import type { DataStatus } from '@/types/data';

export interface FooterProps {
	status: DataStatus; // decides what "Last update" says while loading or on error
	dataAsOf: string | null; // the data file's date (ISO), null until loaded
}
