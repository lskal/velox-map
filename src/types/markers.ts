import type { CameraType, LngLat } from '@/types/camera';

// One marker icon, drawn on a canvas from an SVG path (VXM-006).
export interface MarkerShape {
	width: number; // px, at 1x
	height: number;
	path: string; // SVG path data, in the same px coordinates
	// filled shape, a line with its halo (section), a dashed ring (several), or a plain
	// thin line with no halo (the chevrons on a section line)
	draw: 'fill' | 'line' | 'ring' | 'stroke';
	dash?: number[]; // the ring's dash pattern, px
	lineWidth?: number; // 'stroke' only, px
	colourVar: string; // CSS variable in _map.scss
}

// What one marker stands for: a camera type, or 'several' - one spot with two or more
// cameras, same type or not (VXM-007, the grey dashed ring with the count).
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

// A one-point section (France) with its own source, so each icon can carry the angle of
// the road under it (VXM-010 D1). No angle yet → not shown.
export type SectionIcon = { id: string; position: LngLat };

export type SectionIconFeature = {
	type: 'Feature';
	geometry: { type: 'Point'; coordinates: LngLat };
	properties: { id: string; angle?: number }; // icon rotation in degrees, 0-180
};

export type SectionIconCollection = {
	type: 'FeatureCollection';
	features: SectionIconFeature[];
};

// A section drawn as a line along the road (VXM-010 D8): from the official data (a path
// in the source) or from OSM (France, OSM extras on).
export type SectionLine = {
	id: string;
	path: LngLat[]; // in the direction it applies to, when `direction` is true
	direction: boolean; // known → two chevrons along the line
	community: boolean; // drawn from OSM → the wider line
};

// The section-lines source: the lines, and the bars and chevrons as rotated icons.
export type SectionLineIcon = 'section-bar' | 'section-chevron';

export type SectionLineFeature =
	| {
			type: 'Feature';
			geometry: { type: 'LineString'; coordinates: LngLat[] };
			properties: { id: string; width: number };
	  }
	| {
			type: 'Feature';
			geometry: { type: 'Point'; coordinates: LngLat };
			properties: { id: string; icon: SectionLineIcon; angle: number };
	  };

export type SectionLineCollection = {
	type: 'FeatureCollection';
	features: SectionLineFeature[];
};
