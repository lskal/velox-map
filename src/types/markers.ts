import type { CameraType, LngLat } from '@/types/camera';

// One marker icon, drawn on a canvas from an SVG path (VXM-006).
export interface MarkerShape {
	width: number; // px, at 1×
	height: number;
	path: string; // SVG path data, in the same px coordinates
	draw: 'fill' | 'line'; // filled shape, or a line (the section icon)
	colourVar: string; // CSS variable in _map.scss
}

export type MarkerShapes = Partial<Record<CameraType, MarkerShape>>;

// What the map's camera source holds: one point per camera, with only the fields the
// map needs (plan.md → "GeoJSON built from the map fields only"). Type aliases, not
// interfaces, so MapLibre accepts them as GeoJSON.
export type CameraFeature = {
	type: 'Feature';
	geometry: { type: 'Point'; coordinates: LngLat };
	properties: { id: string; type: CameraType };
};

export type CameraFeatureCollection = {
	type: 'FeatureCollection';
	features: CameraFeature[];
};
