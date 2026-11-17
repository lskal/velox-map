import type {
	ExpressionSpecification,
	GeoJSONSource,
	Map as MapLibreMap,
} from 'maplibre-gl';
import {
	MARKER_HALO_VAR,
	MARKER_HALO_WIDTH,
	MARKER_LAYER_ORDER,
	SECTION_LINE,
	SECTION_LINE_ICONS,
} from '@/config/markers';
import { bearing, distance } from '@/lib/geo';
import type { LngLat } from '@/types/camera';
import type { CountryMapSettings } from '@/types/map';
import type {
	SectionLine,
	SectionLineCollection,
	SectionLineFeature,
	SectionLineIcon,
} from '@/types/markers';
import { addShapeImage, cssColour } from './markers';

// Sections drawn as lines along the road (VXM-010 D8; DESIGN.md → Average-speed
// section): a halo line, the section line on top, a bar across each end and, when the
// direction is known, two chevrons pointing the way it applies. Bars and chevrons are
// small icons placed and turned here, once per data change - nothing is computed while
// the map moves. Shared by every country: France gets its paths from OSM, others will
// pass their official paths.

export const SECTION_LINE_SOURCE = 'section-lines';
const HALO_LAYER = 'section-lines-halo';
const LINE_LAYER = 'section-lines';
const ICON_LAYER = 'section-lines-icons';

export const NO_SECTION_LINES: SectionLineCollection = {
	type: 'FeatureCollection',
	features: [],
};

// The point at `share` (0-1) of the path's length, and the bearing of the piece it's on.
function pointAlong(
	path: LngLat[],
	share: number,
): { position: LngLat; bearing: number } {
	const lengths = path.slice(1).map((point, i) => distance(path[i], point));
	let left = lengths.reduce((sum, length) => sum + length, 0) * share;
	for (let i = 0; i < lengths.length; i++) {
		const [a, b] = [path[i], path[i + 1]];
		if (left <= lengths[i] || i === lengths.length - 1) {
			const t = lengths[i] > 0 ? Math.min(left / lengths[i], 1) : 0;
			return {
				position: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
				bearing: bearing(a, b),
			};
		}
		left -= lengths[i];
	}
	return { position: path[0], bearing: 90 };
}

// An icon drawn for a line going east, turned to `lineBearing` (0 = north, 90 = east).
function icon(
	id: string,
	name: SectionLineIcon,
	position: LngLat,
	lineBearing: number,
): SectionLineFeature {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: position },
		properties: { id, icon: name, angle: lineBearing - 90 },
	};
}

export function toSectionLineCollection(
	sections: SectionLine[],
): SectionLineCollection {
	const features: SectionLineFeature[] = [];
	for (const { id, path, direction, community } of sections) {
		if (path.length < 2) continue;
		const last = path.length - 1;
		features.push({
			type: 'Feature',
			geometry: { type: 'LineString', coordinates: path },
			properties: {
				id,
				width: community
					? SECTION_LINE.communityWidth
					: SECTION_LINE.width,
			},
		});
		features.push(
			icon(id, 'section-bar', path[0], bearing(path[0], path[1])),
			icon(
				id,
				'section-bar',
				path[last],
				bearing(path[last - 1], path[last]),
			),
		);
		if (direction) {
			for (const share of SECTION_LINE.chevronsAt) {
				const at = pointAlong(path, share);
				features.push(
					icon(id, 'section-chevron', at.position, at.bearing),
				);
			}
		}
	}
	return { type: 'FeatureCollection', features };
}

// Source, icons and layers, on every style load (like the markers). Under all the
// camera icons, so a camera on the line stays visible.
export function addSectionLines(
	map: MapLibreMap,
	data: SectionLineCollection,
	settings: CountryMapSettings,
) {
	for (const [name, shape] of Object.entries(SECTION_LINE_ICONS)) {
		addShapeImage(map, name, shape);
	}
	if (map.getSource(SECTION_LINE_SOURCE)) return;
	map.addSource(SECTION_LINE_SOURCE, { type: 'geojson', data });

	const below = MARKER_LAYER_ORDER.map(type => `cameras-${type}`).find(id =>
		map.getLayer(id),
	);
	const minzoom = settings.clustered ? settings.markerMinZoom : 0;
	const isLine: ExpressionSpecification = [
		'==',
		['geometry-type'],
		'LineString',
	];
	const width: ExpressionSpecification = ['get', 'width'];

	map.addLayer(
		{
			id: HALO_LAYER,
			type: 'line',
			source: SECTION_LINE_SOURCE,
			minzoom,
			filter: isLine,
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': cssColour(MARKER_HALO_VAR),
				'line-width': ['+', width, 2 * MARKER_HALO_WIDTH],
			},
		},
		below,
	);
	map.addLayer(
		{
			id: LINE_LAYER,
			type: 'line',
			source: SECTION_LINE_SOURCE,
			minzoom,
			filter: isLine,
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': cssColour('--color-marker-section'),
				'line-width': width,
			},
		},
		below,
	);
	map.addLayer(
		{
			id: ICON_LAYER,
			type: 'symbol',
			source: SECTION_LINE_SOURCE,
			minzoom,
			filter: ['==', ['geometry-type'], 'Point'],
			layout: {
				'icon-image': ['get', 'icon'],
				'icon-rotate': ['get', 'angle'],
				'icon-rotation-alignment': 'map', // turns with the map, stays on the line
				'icon-allow-overlap': true,
				'icon-ignore-placement': true,
			},
		},
		below,
	);
}

export function updateSectionLines(
	map: MapLibreMap,
	data: SectionLineCollection,
) {
	map.getSource<GeoJSONSource>(SECTION_LINE_SOURCE)?.setData(data);
}
