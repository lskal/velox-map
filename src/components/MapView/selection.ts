import type {
	ExpressionSpecification,
	FilterSpecification,
	GeoJSONSource,
	Map as MapLibreMap,
	MapGeoJSONFeature,
} from 'maplibre-gl';
import {
	MARKER_LAYER_ORDER,
	SELECTED_RING,
	SELECTED_SECTION_ICON,
	SELECTED_SECTION_EXTRA,
} from '@/config/markers';
import type { LngLat } from '@/types/camera';
import type { CountryMapSettings } from '@/types/map';
import type {
	SectionIcon,
	SelectedSpot,
	SelectionShape,
} from '@/types/markers';
import {
	addShapeImage,
	CLUSTER_LAYERS,
	cssColour,
	iconSizeExpression,
	isClusterLayer,
} from './markers';
import { SECTION_ICON_LAYER } from './sectionIcons';
import {
	HALO_LAYER,
	SECTION_LINE_LAYERS,
	SECTION_LINE_SOURCE,
} from './sectionLines';

// Selecting a marker (VXM-011 D6): which marker a click landed on, and the accent
// outline of the selected one - a ring for a round marker, the section's own shape for
// a one-point section, a band along a section line. Shared by every country: it only
// knows layer ids.

const SELECTED_SOURCE = 'selected';
const RING_LAYER = 'selected-ring';
const SECTION_LAYER = 'selected-section';
const LINE_LAYER = 'selected-line';
const SECTION_IMAGE = 'section-selected';

// Every layer a click can select from: the camera icons, the one-point sections and
// the section lines (with their bars and chevrons).
const SELECTABLE_LAYERS = [
	...MARKER_LAYER_ORDER.filter(type => type !== 'section').map(
		type => `cameras-${type}`,
	),
	SECTION_ICON_LAYER,
	...SECTION_LINE_LAYERS,
];

// How the selected spot is outlined: a band along its line when it's drawn as one, its
// own shape turned like its icon for a one-point section, a ring for anything round.
export function toSelectionShape(
	spot: SelectedSpot | null,
	drawnAsLines: Set<string>,
	sections: SectionIcon[],
	angles: Map<string, number>,
): SelectionShape | null {
	if (!spot) return null;
	if (drawnAsLines.has(spot.id)) return { kind: 'line', id: spot.id };
	if (sections.some(section => section.id === spot.id)) {
		return {
			kind: 'section',
			position: spot.position,
			angle: angles.get(spot.id) ?? 0,
		};
	}
	return { kind: 'ring', position: spot.position };
}

// The ring or the section outline as one point (the line is a filter, not data).
function pointData(shape: SelectionShape | null) {
	return {
		type: 'FeatureCollection' as const,
		features:
			shape && shape.kind !== 'line'
				? [
						{
							type: 'Feature' as const,
							geometry: {
								type: 'Point' as const,
								coordinates: shape.position,
							},
							properties: {
								kind: shape.kind,
								angle:
									shape.kind === 'section' ? shape.angle : 0,
							},
						},
					]
				: [],
	};
}

// Only the selected section's line - no id matches '' when nothing is selected.
function lineFilter(shape: SelectionShape | null): FilterSpecification {
	return [
		'all',
		['==', ['geometry-type'], 'LineString'],
		['==', ['get', 'id'], shape?.kind === 'line' ? shape.id : ''],
	];
}

// Sources, image and layers, on every style load (like the markers). Each outline sits
// right under what it outlines, so the marker stays on top; the ring goes above all.
// The accent colour is read again after a theme switch.
export function addSelection(
	map: MapLibreMap,
	shape: SelectionShape | null,
	settings: CountryMapSettings,
) {
	addShapeImage(map, SECTION_IMAGE, SELECTED_SECTION_ICON);
	if (map.getSource(SELECTED_SOURCE)) return;
	map.addSource(SELECTED_SOURCE, { type: 'geojson', data: pointData(shape) });

	const accent = cssColour(SELECTED_RING.colourVar);
	const minzoom = settings.clustered ? settings.markerMinZoom : 0;
	// The ring grows with the icons: the same [zoom, scale] pairs as icon-size.
	const ringRadius: ExpressionSpecification = [
		'interpolate',
		['linear'],
		['zoom'],
		...settings.iconSize.flatMap(([zoom, scale]) => [
			zoom,
			SELECTED_RING.radius * scale,
		]),
	];

	if (map.getSource(SECTION_LINE_SOURCE)) {
		map.addLayer(
			{
				id: LINE_LAYER,
				type: 'line',
				source: SECTION_LINE_SOURCE,
				minzoom,
				filter: lineFilter(shape),
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': accent,
					'line-width': [
						'+',
						['get', 'width'],
						SELECTED_SECTION_EXTRA,
					],
				},
			},
			map.getLayer(HALO_LAYER) ? HALO_LAYER : undefined,
		);
	}
	map.addLayer(
		{
			id: SECTION_LAYER,
			type: 'symbol',
			source: SELECTED_SOURCE,
			minzoom,
			filter: ['==', ['get', 'kind'], 'section'],
			layout: {
				'icon-image': SECTION_IMAGE,
				'icon-size': iconSizeExpression(settings),
				'icon-rotate': ['get', 'angle'],
				'icon-rotation-alignment': 'map',
				'icon-allow-overlap': true,
				'icon-ignore-placement': true,
			},
		},
		map.getLayer(SECTION_ICON_LAYER) ? SECTION_ICON_LAYER : undefined,
	);
	map.addLayer({
		id: RING_LAYER,
		type: 'circle',
		source: SELECTED_SOURCE,
		minzoom,
		filter: ['==', ['get', 'kind'], 'ring'],
		paint: {
			'circle-color': 'rgba(0, 0, 0, 0)',
			'circle-radius': ringRadius,
			'circle-stroke-width': SELECTED_RING.width,
			'circle-stroke-color': accent,
		},
	});
}

export function updateSelection(
	map: MapLibreMap,
	shape: SelectionShape | null,
) {
	map.getSource<GeoJSONSource>(SELECTED_SOURCE)?.setData(pointData(shape));
	if (map.getLayer(LINE_LAYER)) map.setFilter(LINE_LAYER, lineFilter(shape));
}

// Clicks → the selected spot, or null for a click on the empty map. Clusters keep their
// own click (zoom in, VXM-007) and don't clear the selection. Registered once per map:
// layer events survive style switches. `positionOf` gives the official position of a
// camera id - a section line's own coordinates aren't where its marker was.
export function addSelectClicks(
	map: MapLibreMap,
	onSelect: (spot: SelectedSpot | null) => void,
	positionOf: (id: string) => LngLat | undefined,
) {
	map.on('click', event => {
		const layers = [...SELECTABLE_LAYERS, ...CLUSTER_LAYERS].filter(id =>
			map.getLayer(id),
		);
		const [feature]: MapGeoJSONFeature[] = map.queryRenderedFeatures(
			event.point,
			{ layers },
		);
		if (feature && isClusterLayer(feature.layer.id)) return;

		const id = feature?.properties?.id as string | undefined;
		const position = id ? positionOf(id) : undefined;
		onSelect(id && position ? { id, position } : null);
	});

	for (const layer of SELECTABLE_LAYERS) {
		map.on('mouseenter', layer, () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', layer, () => {
			map.getCanvas().style.cursor = '';
		});
	}
}
