import type { MarkerKind, MarkerShapes } from '@/types/markers';

// Marker shapes - DESIGN.md chapter 2 → Map markers; paths copied from the canvas
// (Tokens board), so the map draws exactly what was designed. Only the types France
// needs (VXM-006); each country adds its own when it needs one.
export const MARKER_SHAPES: MarkerShapes = {
	// circle, 16 px with the halo
	speed: {
		width: 22,
		height: 22,
		path: 'M4 11 A7 7 0 1 0 18 11 A7 7 0 1 0 4 11 Z',
		draw: 'fill',
		colourVar: '--color-marker-speed',
	},
	// rounded square 14 px, radius 4
	red_light: {
		width: 22,
		height: 22,
		path: 'M8 4 H14 A4 4 0 0 1 18 8 V14 A4 4 0 0 1 14 18 H8 A4 4 0 0 1 4 14 V8 A4 4 0 0 1 8 4 Z',
		draw: 'fill',
		colourVar: '--color-marker-red-light',
	},
	// diamond 14 px
	level_crossing: {
		width: 22,
		height: 22,
		path: 'M11 2.5 L19.5 11 L11 19.5 L2.5 11 Z',
		draw: 'fill',
		colourVar: '--color-marker-level-crossing',
	},
	// section known by one point (France): bar - line - bar, ~24 px wide, horizontal
	section: {
		width: 30,
		height: 18,
		path: 'M5 9 H25 M5 4 V14 M25 4 V14',
		draw: 'line',
		colourVar: '--color-marker-section',
	},
	// several devices at one spot: the OSM report's dashed ring, r 8, in its grey;
	// the count is the layer's text (VXM-007 D3)
	several: {
		width: 22,
		height: 22,
		path: 'M3 11 A8 8 0 1 0 19 11 A8 8 0 1 0 3 11 Z',
		draw: 'ring',
		dash: [2.4, 2],
		colourVar: '--color-marker-several',
	},
};

export const MARKER_HALO_VAR = '--color-marker-halo';
export const MARKER_HALO_WIDTH = 2.5; // px, DESIGN.md
export const MARKER_LINE_WIDTH = 3; // px, the section line
export const MARKER_RING_WIDTH = 1.8; // px, the 'several' ring

// Map layers bottom → top: rarer and more critical types on top (VXM-006 D3);
// 'several' last - it stands for more than one camera.
export const MARKER_LAYER_ORDER: MarkerKind[] = [
	'speed',
	'section',
	'level_crossing',
	'red_light',
	'several',
];
