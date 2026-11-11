import type { LngLatBoundsLike } from 'maplibre-gl';
import type { Theme } from '@/types/theme';

// Basemap per page theme: OpenFreeMap "dark" (VXM-004) and "positron" (light, VXM-006).
// One place, so the provider can be swapped (OpenFreeMap has no SLA - plan.md → Stack).
export const MAP_STYLE_URLS: Record<Theme, string> = {
	dark: 'https://tiles.openfreemap.org/styles/dark',
	light: 'https://tiles.openfreemap.org/styles/positron',
};

// Metropolitan France + Corsica: [west, south], [east, north] in [lng, lat] order.
export const FRANCE_BOUNDS: LngLatBoundsLike = [
	[-5.2, 41.3],
	[9.6, 51.1],
];
