import type { CountryCode, CountryMapSettings } from '@/types/map';
import type { Theme } from '@/types/theme';

// Basemap per page theme: OpenFreeMap "dark" (VXM-004) and "positron" (light, VXM-006).
// One place, so the provider can be swapped (OpenFreeMap has no SLA - plan.md → Stack).
export const MAP_STYLE_URLS: Record<Theme, string> = {
	dark: 'https://tiles.openfreemap.org/styles/dark',
	light: 'https://tiles.openfreemap.org/styles/positron',
};

// The basemap's road lines, read to turn the one-point section icons to the road
// (VXM-010 D1). Names from the OpenMapTiles schema, used by both OpenFreeMap styles.
export const BASEMAP_ROADS = {
	source: 'openmaptiles',
	layer: 'transportation',
	classes: new Set([
		'motorway',
		'trunk',
		'primary',
		'secondary',
		'tertiary',
		'minor',
		'service',
	]),
	searchMetres: 30, // a road further away than this → the icon is horizontal for now
	// no road found → read again this many zoom levels further in, where the tiles carry
	// the smaller roads and their real shape (VXM-010 T10)
	retryZoomStep: 1,
};

// Cameras closer than this are one spot: one marker, one card (VXM-011 T5). The French
// file spreads some radars ~0.7 m apart (one per lane on the A86, data-sources.md);
// separate radar sites are hundreds of metres apart at least.
export const SAME_SPOT_METRES = 10;

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
		markerMinZoom: 8, // single markers from here (tuned 2026-11-13)
		clusterRadius: 50, // to tune again on the real map (tuned 2026-11-13)
		iconSize: [
			[8, 0.5], // region zoom: half size
			[14, 1.2], // zoomed in close: a bit above the designed size
		],
	},
};

export const LICENCES_LINKS = {
	osm: 'https://www.openstreetmap.org/copyright',
	openFreeMap: 'https://openfreemap.org',
	openMapTiles: 'https://openmaptiles.org',
	source: 'https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/',
	licence: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
};
