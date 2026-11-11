import type { CameraType } from '@/types/camera';

// One marker icon, drawn on a canvas from an SVG path (VXM-006).
export interface MarkerShape {
	width: number; // px, at 1×
	height: number;
	path: string; // SVG path data, in the same px coordinates
	draw: 'fill' | 'line'; // filled shape, or a line (the section icon)
	colourVar: string; // CSS variable in _map.scss
}

export type MarkerShapes = Partial<Record<CameraType, MarkerShape>>;
