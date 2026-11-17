import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { BASEMAP_ROADS } from '@/config/map';
import { MARKER_LAYER_ORDER } from '@/config/markers';
import { bearing, distanceToSegment } from '@/lib/geo';
import type { LngLat } from '@/types/camera';
import type { CountryMapSettings } from '@/types/map';
import type {
	CameraFeatureCollection,
	SectionIcon,
	SectionIconCollection,
} from '@/types/markers';
import { iconSizeExpression } from './markers';

// One-point section icons turned to the road angle (VXM-010 D1). The sections keep their
// place in the clustered camera source (clusters count them); above the marker zoom they
// are drawn from this small source instead, where each icon carries its own angle.
// The angle comes from the basemap's road lines - no extra data - and is read once,
// when the map is idle (all tiles in view loaded). An icon without an angle isn't shown,
// so nothing appears horizontal and then turns (R2b).

export const SECTION_ICON_SOURCE = 'section-icons';
const SECTION_ICON_LAYER = 'section-icons';
const NEAR_DEGREES = 0.001; // ~100 m: segments further than this are skipped quickly

// The single 'section' markers of the camera source (a grouped spot stays 'several').
export function toSectionIcons(
	cameras: CameraFeatureCollection,
): SectionIcon[] {
	return cameras.features
		.filter(feature => feature.properties.type === 'section')
		.map(feature => ({
			id: feature.properties.id,
			position: feature.geometry.coordinates,
		}));
}

export function toSectionIconCollection(
	sections: SectionIcon[],
	angles: Map<string, number>,
): SectionIconCollection {
	return {
		type: 'FeatureCollection',
		features: sections.map(({ id, position }) => {
			const angle = angles.get(id);
			return {
				type: 'Feature',
				geometry: { type: 'Point', coordinates: position },
				properties: angle === undefined ? { id } : { id, angle },
			};
		}),
	};
}

// Source + layer, on every style load (like the markers). Placed in the section's slot
// of MARKER_LAYER_ORDER, so the layer order stays as designed.
export function addSectionIcons(
	map: MapLibreMap,
	data: SectionIconCollection,
	settings: CountryMapSettings,
) {
	if (map.getSource(SECTION_ICON_SOURCE)) return;
	map.addSource(SECTION_ICON_SOURCE, { type: 'geojson', data });

	const next = MARKER_LAYER_ORDER[MARKER_LAYER_ORDER.indexOf('section') + 1];
	map.addLayer(
		{
			id: SECTION_ICON_LAYER,
			type: 'symbol',
			source: SECTION_ICON_SOURCE,
			minzoom: settings.clustered ? settings.markerMinZoom : 0,
			filter: ['has', 'angle'],
			layout: {
				'icon-image': 'section',
				'icon-size': iconSizeExpression(settings),
				'icon-allow-overlap': true,
				'icon-rotate': ['get', 'angle'],
				'icon-rotation-alignment': 'map', // turns with the map
			},
		},
		next && map.getLayer(`cameras-${next}`) ? `cameras-${next}` : undefined,
	);
}

export function updateSectionIcons(
	map: MapLibreMap,
	data: SectionIconCollection,
) {
	map.getSource<GeoJSONSource>(SECTION_ICON_SOURCE)?.setData(data);
}

// The road lines of the basemap tiles loaded now, as lists of points.
function loadedRoadLines(map: MapLibreMap): LngLat[][] {
	const lines: LngLat[][] = [];
	const roads = map.querySourceFeatures(BASEMAP_ROADS.source, {
		sourceLayer: BASEMAP_ROADS.layer,
	});
	for (const road of roads) {
		if (!BASEMAP_ROADS.classes.has(String(road.properties?.class)))
			continue;
		const { geometry } = road;
		if (geometry.type === 'LineString') {
			lines.push(geometry.coordinates as LngLat[]);
		} else if (geometry.type === 'MultiLineString') {
			lines.push(...(geometry.coordinates as LngLat[][]));
		}
	}
	return lines;
}

// The icon angle for one section: the nearest road segment within the search distance,
// turned so the horizontal icon lies along it, folded into 0-180 (no front or back).
// No road close enough → null (the icon then stays horizontal).
function iconAngle(position: LngLat, lines: LngLat[][]): number | null {
	let nearest = Infinity;
	let roadBearing = 90;
	for (const line of lines) {
		for (let i = 0; i < line.length - 1; i++) {
			const a = line[i];
			const b = line[i + 1];
			// Quick skip: the point is clearly outside the segment's box.
			if (
				position[0] < Math.min(a[0], b[0]) - NEAR_DEGREES ||
				position[0] > Math.max(a[0], b[0]) + NEAR_DEGREES ||
				position[1] < Math.min(a[1], b[1]) - NEAR_DEGREES ||
				position[1] > Math.max(a[1], b[1]) + NEAR_DEGREES
			) {
				continue;
			}
			const distance = distanceToSegment(position, a, b);
			if (distance < nearest) {
				nearest = distance;
				roadBearing = bearing(a, b);
			}
		}
	}
	if (nearest > BASEMAP_ROADS.searchMetres) return null;
	return (((roadBearing - 90) % 180) + 180) % 180;
}

// Reads the angle of every section in view that doesn't have one yet. Called on 'idle':
// the tiles in view are loaded then. Each angle is read once and kept (D1).
export function readRoadAngles(
	map: MapLibreMap,
	sections: SectionIcon[],
	angles: Map<string, number>,
	settings: CountryMapSettings,
): { found: number; noRoad: number } {
	const result = { found: 0, noRoad: 0 };
	if (map.getZoom() < settings.markerMinZoom) return result;

	const bounds = map.getBounds();
	const waiting = sections.filter(
		section => !angles.has(section.id) && bounds.contains(section.position),
	);
	if (waiting.length === 0) return result;

	const lines = loadedRoadLines(map);
	for (const section of waiting) {
		const angle = iconAngle(section.position, lines);
		angles.set(section.id, angle ?? 0);
		result.found++;
		if (angle === null) result.noRoad++;
	}
	return result;
}
