import type { CountryCode } from '@/types/map';

// Where the app finds each country's ready data file (VXM-010 R3b). Served from the Blob
// store by the /data/ function (VXM-012 D3); locally the dev server forwards /data/ to the
// deployed site (vite.config.ts).
export const DATA_FILES = {
	FR: '/data/fr.json',
};

// After how many days without a new file the stale line shows (VXM-012 R10b, Max
// 2026-11-19). The job alert comes earlier, after 3 days (R10c).
export const STALE_DAYS: Partial<Record<CountryCode, number>> = {
	FR: 0,
};
