import type { CameraType, LngLat } from '@/types/camera';

// OpenStreetMap extras (VXM-010): what the Overpass API returns, the per-country
// settings and the file the matching writes.

// --- Overpass JSON (`[out:json]`, `out geom`) - only the fields we read ---

export type OsmTags = Record<string, string>;

export interface OverpassNode {
	type: 'node';
	id: number;
	lat: number;
	lon: number;
	tags?: OsmTags;
}

export interface OverpassWay {
	type: 'way';
	id: number;
	nodes?: number[]; // node ids, in the way's order
	geometry?: { lat: number; lon: number }[]; // same order as `nodes`
	tags?: OsmTags;
}

export interface OverpassMember {
	type: 'node' | 'way' | 'relation';
	ref: number;
	role: string; // 'from', 'to', 'device', 'section'…
	lat?: number; // nodes
	lon?: number;
	geometry?: { lat: number; lon: number }[]; // ways
}

export interface OverpassRelation {
	type: 'relation';
	id: number;
	members: OverpassMember[];
	tags?: OsmTags;
}

export type OverpassElement = OverpassNode | OverpassWay | OverpassRelation;

export interface OverpassResponse {
	elements: OverpassElement[];
}

// --- Per-country settings (VXM-010 D5, R13) ---

export interface OsmSettings {
	mode: 'extras' | 'reports'; // extras: adds to official devices only; reports: also OSM-only cameras (Italy)
	label: string; // the switch, e.g. "OSM extras"
	tooltip: string; // desktop tooltip and the mobile (i) text
	noticeTitle: string; // first-use notice
	noticeText: string;
	fileUrl: string; // where the app loads the OSM file
	cameraMatchMetres: number; // OSM camera ↔ official camera
	sectionMatchMetres: number; // official section point ↔ the OSM relation's nearest camera / from / to
	directionTypes: CameraType[]; // official types that get an OSM direction
	// Where to ask Overpass: a box [south, west, north, east], asked in tiles - much
	// lighter than a country area (gis-basics.md ch. 11)
	overpassBox: [number, number, number, number];
}

// --- The OSM file (VXM-010 D4) ---

// Compass degrees (0 = north), one or more; or 'both' directions.
export type OsmDirection = number[] | 'both';

export interface OsmCameraCounts {
	cameras: number; // official cameras of a matched type
	withDirection: number;
	unreadable: number; // OSM direction values that couldn't be read
}

export interface OsmSectionCounts {
	sections: number; // official sections
	withPath: number;
	notJoined: number; // OSM relation found, but its road pieces don't make one line
	noRelation: number; // no OSM relation close enough
}

export interface OsmExtrasFile {
	source: string; // "© OpenStreetMap contributors"
	licence: string; // "ODbL 1.0"
	generatedAt: string; // ISO
	country: string;
	counts: { cameras: OsmCameraCounts; sections: OsmSectionCounts };
	directions: Record<string, OsmDirection>; // official camera id → direction
	sections: Record<string, { path: LngLat[] }>; // official section id → path, `from` → `to`
	missingTiles?: string[]; // only in a partial local file: the Overpass tiles that failed
}
