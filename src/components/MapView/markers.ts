import type { Map as MapLibreMap } from 'maplibre-gl';
import {
	MARKER_HALO_VAR,
	MARKER_HALO_WIDTH,
	MARKER_LAYER_ORDER,
	MARKER_LINE_WIDTH,
	MARKER_SHAPES,
} from '@/config/markers';
import type { CameraFeatureCollection, MarkerShape } from '@/types/markers';

// Camera markers on the map (VXM-006): icons drawn from the designed shapes, one
// source with the cameras, one layer per camera type.

export const CAMERA_SOURCE = 'cameras';
const PIXEL_RATIO = 2; // drawn at 2×: sharp on retina screens

export const NO_CAMERAS: CameraFeatureCollection = {
	type: 'FeatureCollection',
	features: [],
};

// The current value of a CSS variable from _map.scss - light or dark, whatever
// <html data-theme> says right now. MapLibre can't read var(--…) itself.
function cssColour(name: string): string {
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

// Icons, source and layers. Called on every 'style.load' - the first style and each
// theme switch, because setStyle() throws away everything we added (plan D6).
export function addMarkers(map: MapLibreMap, cameras: CameraFeatureCollection) {
	for (const [type, shape] of Object.entries(MARKER_SHAPES)) {
		if (!shape) continue;
		const image = drawMarker(shape);
		if (map.hasImage(type)) {
			map.updateImage(type, image);
		} else {
			map.addImage(type, image, { pixelRatio: PIXEL_RATIO });
		}
	}

	if (!map.getSource(CAMERA_SOURCE)) {
		map.addSource(CAMERA_SOURCE, { type: 'geojson', data: cameras });
	}

	// One layer per type, bottom → top (plan D3).
	for (const type of MARKER_LAYER_ORDER) {
		const id = `cameras-${type}`;
		if (map.getLayer(id)) continue;
		map.addLayer({
			id,
			type: 'symbol',
			source: CAMERA_SOURCE,
			filter: ['==', ['get', 'type'], type],
			layout: {
				'icon-image': type,
				'icon-allow-overlap': true, // clusters handle overlap in VXM-007
			},
		});
	}
}
