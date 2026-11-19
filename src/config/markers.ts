import type {
	MarkerKind,
	MarkerShape,
	MarkerShapes,
	SectionLineIcon,
} from '@/types/markers';

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

// A section drawn along the road (DESIGN.md → Average-speed section; VXM-010 D8):
// 3 px line, 4 px when drawn from OSM, a bar across each end, and two small chevrons at
// 35 % and 70 % of the length when the direction is known. Never an arrowhead.
export const SECTION_LINE = {
	width: MARKER_LINE_WIDTH, // px, official path
	communityWidth: 4, // px, path drawn from OSM
	chevronsAt: [0.35, 0.7], // share of the length, from the start
};

// The bar and the chevron as icons, drawn for a line going east (left → right); each one
// is turned to the line's bearing on the map.
export const SECTION_LINE_ICONS: Record<SectionLineIcon, MarkerShape> = {
	// the same bar as the one-point section icon: 10 px across the line
	'section-bar': {
		width: 10,
		height: 18,
		path: 'M5 4 V14',
		draw: 'line',
		colourVar: '--color-marker-section',
	},
	// a small ">" on the line, pointing the way the section applies
	'section-chevron': {
		width: 10,
		height: 10,
		path: 'M3.5 2.5 L6 5 L3.5 7.5',
		draw: 'stroke',
		lineWidth: 2,
		// the halo colour: dark on the dark map, white on the light one - the same
		// contrast rule as every marker's outline (Max, 2026-11-17)
		colourVar: MARKER_HALO_VAR,
	},
};

// The selected marker's ring (DESIGN.md → Detail card: "a 2.5-3.5 px accent outline"):
// radius at icon scale 1, grows with the icons by zoom (VXM-011 D6).
export const SELECTED_RING = {
	radius: 12, // px, just outside a 16 px marker with its halo
	width: 3, // px
	colourVar: '--color-accent',
};

// A selected section isn't round, so it gets its own outline instead of the ring
// (Max, 2026-11-18): the same shape in the accent colour, 3 px wider than its halo on
// each side, drawn under it. One-point icon: this shape, turned like the icon (the
// section path moved 7 px in a bigger box, so the wide stroke isn't cut). Line: the
// same band along the whole line (selection.ts).
// added to a section's line width: its halo + the accent band, both sides (11 px)
export const SELECTED_SECTION_EXTRA =
	2 * MARKER_HALO_WIDTH + 2 * SELECTED_RING.width;
export const SELECTED_SECTION_ICON: MarkerShape = {
	width: 44,
	height: 32,
	path: 'M12 16 H32 M12 11 V21 M32 11 V21',
	draw: 'stroke',
	lineWidth: MARKER_LINE_WIDTH + SELECTED_SECTION_EXTRA, // 14 px
	colourVar: SELECTED_RING.colourVar,
};
