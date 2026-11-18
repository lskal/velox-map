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
	spotOf: Map<string, CameraSpot>; // any camera id → its spot
};

// One spot on the map (VXM-011 T5): where its marker is and the cameras it holds.
export type CameraSpot = { position: LngLat; ids: string[] };

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

// The spot whose detail card is open (VXM-011 D6): the clicked marker's camera id (the
// first one at a shared spot) and the official position - where the selected ring goes.
export type SelectedSpot = { id: string; position: LngLat; ids: string[] };

// How the selected spot is outlined (VXM-011 D6): a ring for a round marker, the
// section's own shape for a one-point section (turned like its icon), or a band along
// a section line.
export type SelectionShape =
	| { kind: 'ring'; position: LngLat }
	| { kind: 'section'; position: LngLat; angle: number }
	| { kind: 'line'; id: string };

// Map layer ids that other modules look for (VXM-011): the grey circles a click zooms
// into, and the section line layers a click can select.
export type ClusterLayer = 'clusters' | 'singles';
export type SectionLineLayer = 'section-lines' | 'section-lines-icons';
