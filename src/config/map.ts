import type { CountryCode, CountryMapSettings } from '@/types/map';
import type { Theme } from '@/types/theme';

// Basemap per page theme: OpenFreeMap "dark" (VXM-004) and "positron" (light, VXM-006).
// One place, so the provider can be swapped (OpenFreeMap has no SLA - plan.md → Stack).
export const MAP_STYLE_URLS: Record<Theme, string> = {
	dark: 'https://tiles.openfreemap.org/styles/dark',
	light: 'https://tiles.openfreemap.org/styles/positron',
};

// Per-country map settings (VXM-007). Zoom numbers are tuned on the real map, then
// written into DESIGN.md.
export const COUNTRY_MAP: Record<CountryCode, CountryMapSettings> = {
	FR: {
		// Metropolitan France + Corsica: [west, south], [east, north] in [lng, lat] order.
		// The overseas departments are in the data too, outside this view.
		bounds: [
			[-5.2, 41.3],
			[9.6, 51.1],
		],
		clustered: true,
		markerMinZoom: 9, // or your tuned value
		clusterRadius: 50, // to tune on the real map
	},
};
