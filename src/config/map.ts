import type { LngLatBoundsLike } from 'maplibre-gl';

// Basemap: OpenFreeMap "dark" (VXM-004). One place, so the provider can be swapped
// (OpenFreeMap has no SLA - plan.md → Stack).
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

// Metropolitan France + Corsica: [west, south], [east, north] in [lng, lat] order.
export const FRANCE_BOUNDS: LngLatBoundsLike = [
	[-5.2, 41.3],
	[9.6, 51.1],
];
