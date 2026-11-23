import type {
	ExpressionSpecification,
	GeoJSONSource,
	Map as MapLibreMap,
} from 'maplibre-gl';
import {
	MARKER_HALO_VAR,
	MARKER_HALO_WIDTH,
	MARKER_LAYER_ORDER,
	MARKER_LINE_WIDTH,
	MARKER_RING_WIDTH,
	MARKER_SHAPES,
} from '@/config/markers';
import type { CountryMapSettings } from '@/types/map';
import type {
	CameraFeatureCollection,
	ClusterLayer,
	MarkerShape,
} from '@/types/markers';

// Camera markers on the map (VXM-006): icons drawn from the designed shapes, one
// source with the cameras, one layer per camera type.

export const CAMERA_SOURCE = 'cameras';
const PIXEL_RATIO = 2; // drawn at 2x: sharp on retina screens

export const NO_CAMERAS: CameraFeatureCollection = {
	type: 'FeatureCollection',
	features: [],
};

// The current value of a CSS variable from _map.scss - light or dark, whatever
// <html data-theme> says right now. MapLibre can't read var(--…) itself.
export function cssColour(name: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

// One icon on a small canvas, exactly the designed path (plan D1, D2).
function drawMarker(shape: MarkerShape): ImageData {
	const canvas = document.createElement('canvas');
	canvas.width = shape.width * PIXEL_RATIO;
	canvas.height = shape.height * PIXEL_RATIO;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Markers: no 2D canvas available');

	context.scale(PIXEL_RATIO, PIXEL_RATIO);
	context.lineCap = 'round';
	context.lineJoin = 'round';

	const path = new Path2D(shape.path);
	const colour = cssColour(shape.colourVar);
	const halo = cssColour(MARKER_HALO_VAR);

	if (shape.draw === 'fill') {
		// Filled shape, then the halo as an outline - as on the canvas board.
		context.fillStyle = colour;
		context.fill(path);
		context.strokeStyle = halo;
		context.lineWidth = MARKER_HALO_WIDTH;
		context.stroke(path);
	} else if (shape.draw === 'ring') {
		// Hollow dashed ring (the 'several' icon): filled with the halo colour so the
		// count stays readable, the dashed ring on top - as on the canvas board.
		context.fillStyle = halo;
		context.fill(path);
		context.strokeStyle = colour;
		context.lineWidth = MARKER_RING_WIDTH;
		context.lineCap = 'butt';
		context.setLineDash(shape.dash ?? []);
		context.stroke(path);
	} else if (shape.draw === 'stroke') {
		// A thin line, no halo (the chevrons sit on the section line).
		context.strokeStyle = colour;
		context.lineWidth = shape.lineWidth ?? 1;
		context.stroke(path);
	} else {
		// A line (the section icon): a wide halo line first, the coloured line on top.
		context.strokeStyle = halo;
		context.lineWidth = MARKER_LINE_WIDTH + 2 * MARKER_HALO_WIDTH;
		context.stroke(path);
		context.strokeStyle = colour;
		context.lineWidth = MARKER_LINE_WIDTH;
		context.stroke(path);
	}

	return context.getImageData(0, 0, canvas.width, canvas.height);
}

// Adds an icon to the map's style, or redraws it (theme switch: new colours).
export function addShapeImage(
	map: MapLibreMap,
	name: string,
	shape: MarkerShape,
) {
	const image = drawMarker(shape);
	if (map.hasImage(name)) {
		map.updateImage(name, image);
	} else {
		map.addImage(name, image, { pixelRatio: PIXEL_RATIO });
	}
}

export const CLUSTER_LAYERS: readonly ClusterLayer[] = ['clusters', 'singles'];

// A layer id from a map event is a plain string: this tells whether it's a cluster one.
export function isClusterLayer(id: string): id is ClusterLayer {
	return (CLUSTER_LAYERS as readonly string[]).includes(id);
}

// The device count inside the 'several' ring (canvas: 11 px, bold, the ring's grey).
const SEVERAL_COUNT = {
	'text-field': ['to-string', ['get', 'count']] as ExpressionSpecification,
	'text-font': ['Noto Sans Bold'],
	'text-allow-overlap': true,
};
const SEVERAL_TEXT_SIZE = 11; // px at icon scale 1
const NOT_CLUSTERED: ExpressionSpecification = ['!', ['has', 'point_count']];

// A grey circle with a number (DESIGN.md → Cluster: 34 px, 4 px soft ring, white bold
// text) - for clusters, and for lone cameras below the marker zoom (plan D5).
function addCircleWithCount(
	map: MapLibreMap,
	id: string,
	filter: ExpressionSpecification,
	count: ExpressionSpecification,
	maxzoom?: number,
) {
	map.addLayer({
		id,
		type: 'circle',
		source: CAMERA_SOURCE,
		filter,
		...(maxzoom ? { maxzoom } : {}),
		paint: {
			'circle-color': cssColour('--color-cluster'),
			'circle-radius': 17,
			'circle-stroke-width': 4,
			'circle-stroke-color': cssColour('--color-cluster-ring'),
		},
	});
	map.addLayer({
		id: `${id}-count`,
		type: 'symbol',
		source: CAMERA_SOURCE,
		filter,
		...(maxzoom ? { maxzoom } : {}),
		layout: {
			'text-field': ['to-string', count],
			'text-font': ['Noto Sans Bold'], // a font the OpenFreeMap styles provide
			'text-size': 12,
			'text-allow-overlap': true,
		},
		paint: { 'text-color': cssColour('--color-cluster-text') },
	});
}

// Icons grow with the zoom (VXM-007 R5): 'interpolate' goes smoothly from one
// [zoom, scale] pair to the next, and keeps the first / last scale outside them.
export function iconSizeExpression(
	settings: CountryMapSettings,
): ExpressionSpecification {
	return ['interpolate', ['linear'], ['zoom'], ...settings.iconSize.flat()];
}

// Icons, source and layers. Called on every 'style.load' - the first style and each
// theme switch, because setStyle() throws away everything we added (plan D6).
export function addMarkers(
	map: MapLibreMap,
	cameras: CameraFeatureCollection,
	settings: CountryMapSettings,
) {
	for (const [type, shape] of Object.entries(MARKER_SHAPES)) {
		if (shape) addShapeImage(map, type, shape);
	}

	if (map.getSource(CAMERA_SOURCE)) return; // already there for this style

	map.addSource(CAMERA_SOURCE, {
		type: 'geojson',
		data: cameras,
		cluster: settings.clustered,
		clusterMaxZoom: settings.markerMinZoom - 1,
		clusterRadius: settings.clusterRadius,
		// A cluster shows how many cameras it holds, not how many points: a grouped
		// spot (2 cameras) counts as 2 (plan → Risks).
		clusterProperties: { devices: ['+', ['get', 'count']] },
	});

	if (settings.clustered) {
		// Clusters, at every zoom up to the marker zoom.
		addCircleWithCount(
			map,
			'clusters',
			['has', 'point_count'],
			['get', 'devices'],
		);
		// Lone cameras below the marker zoom: a circle too, so the country view shows
		// groups only and no camera disappears (DESIGN.md → Zoom rule, plan D5).
		addCircleWithCount(
			map,
			'singles',
			NOT_CLUSTERED,
			['get', 'count'],
			settings.markerMinZoom,
		);
	}

	const iconSize = iconSizeExpression(settings);
	// The count inside the 'several' ring grows with it: 11 px x the same scale.
	const countSize: ExpressionSpecification = [
		'interpolate',
		['linear'],
		['zoom'],
		...settings.iconSize.flatMap(([zoom, scale]) => [
			zoom,
			SEVERAL_TEXT_SIZE * scale,
		]),
	];

	// One layer per type, bottom → top (plan D3), from the marker zoom when clustered.
	for (const type of MARKER_LAYER_ORDER) {
		// One-point sections are drawn from their own source, turned to the road
		// (sectionIcons.ts, VXM-010 D1); they stay in this source for the clusters.
		if (type === 'section') continue;
		map.addLayer({
			id: `cameras-${type}`,
			type: 'symbol',
			source: CAMERA_SOURCE,
			minzoom: settings.clustered ? settings.markerMinZoom : 0,
			filter: ['all', NOT_CLUSTERED, ['==', ['get', 'type'], type]],
			layout: {
				'icon-image': type,
				'icon-size': iconSize,
				'icon-allow-overlap': true,
				...(type === 'several'
					? { ...SEVERAL_COUNT, 'text-size': countSize }
					: {}),
			},
			paint:
				type === 'several'
					? { 'text-color': cssColour('--color-marker-several') }
					: {},
		});
	}
}

// Click a grey circle → zoom in: a cluster until it splits, a lone camera to the
// marker zoom (plan D6). Registered once per map - layer events survive style switches.
export function addClusterClicks(
	map: MapLibreMap,
	settings: CountryMapSettings,
) {
	for (const layer of CLUSTER_LAYERS) {
		map.on('click', layer, async event => {
			const feature = event.features?.[0];
			if (!feature || feature.geometry.type !== 'Point') return;
			const center = feature.geometry.coordinates as [number, number];
			const clusterId = feature.properties?.cluster_id as
				number | undefined;

			const zoom =
				clusterId === undefined
					? settings.markerMinZoom
					: await map
							.getSource<GeoJSONSource>(CAMERA_SOURCE)
							?.getClusterExpansionZoom(clusterId);
			map.easeTo({ center, zoom: zoom ?? settings.markerMinZoom });
		});
		map.on('mouseenter', layer, () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', layer, () => {
			map.getCanvas().style.cursor = '';
		});
	}
}
