import type { CameraType, LngLat } from '@/types/camera';

// One marker icon, drawn on a canvas from an SVG path (VXM-006).
export interface MarkerShape {
	width: number; // px, at 1×
	height: number;
	path: string; // SVG path data, in the same px coordinates
	draw: 'fill' | 'line'; // filled shape, or a line (the section icon)
	colourVar: string; // CSS variable in _map.scss
}

// What one marker stands for: a camera type, or 'several' - one spot with cameras of
// different types (VXM-007, the grey dashed ring with the count).
export type MarkerKind = CameraType | 'several';

export type MarkerShapes = Partial<Record<MarkerKind, MarkerShape>>;

// What the map's camera source holds: one point per camera, with only the fields the
// map needs (plan.md → "GeoJSON built from the map fields only"). Type aliases, not
// interfaces, so MapLibre accepts them as GeoJSON.
export type CameraFeature = {
	type: 'Feature';
	geometry: { type: 'Point'; coordinates: LngLat };
	properties: {
		id: string; // the first camera at this spot
		type: MarkerKind;
		count: number; // cameras at this spot (1 for most)
	};
};

export type CameraFeatureCollection = {
	type: 'FeatureCollection';
	features: CameraFeature[];
};

// toCameraFeatures() result: the features + what the grouping found (VXM-007 R2).
export type CameraFeaturesResult = {
	features: CameraFeatureCollection;
	cameras: number; // all cameras
	spots: number; // markers after grouping
	sharedSpots: number; // spots with more than one camera
	mixedSpots: number; // of those, spots with different types
	shared: { position: LngLat; ids: string[]; types: CameraType[] }[]; // spots with more than one camera
};
