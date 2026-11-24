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
	tooltip: string; // tooltip, (i) card and first-use card
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

// An OSM `direction` value read by parseOsmDirection() (lib/osm/direction.ts).
export interface ParsedDirection {
	direction: OsmDirection | null; // null = nothing readable
	unreadable: number; // values that couldn't be read
}

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
}

// The OSM data collected but not shown yet (VXM-012 D6): red-light cameras and the road
// under every OSM speed camera - for the card ticket (VXM-015) to design with. Raw OSM
// values, only the useful tags kept. Not served by /data/ until the card uses it.
export interface OsmMoreFile {
	source: string;
	licence: string;
	generatedAt: string;
	country: string;
	counts: { redLight: number; cameras: number; camerasWithRoad: number };
	redLight: { id: string; lat: number; lon: number; tags: OsmTags }[]; // id "node/123" / "relation/45"
	cameras: {
		id: number;
		lat: number;
		lon: number;
		tags: OsmTags;
		road?: OsmTags; // the tags of the road the camera sits on
	}[];
}

// --- The switch in the app (VXM-010 D5, D7) ---

// off → loading → on; a failed load goes back to off with the error message.
export type OsmStatus = 'off' | 'loading' | 'on';
// What the card under the switch shows by itself: the explanation the first time the
// switch is turned on, or the error.
export type OsmNotice = 'first-use' | 'error';

// The OSM file joined to the official cameras (D5, R11) - what the map and the card read.
export interface OsmSectionPath {
	id: string; // official section id
	path: LngLat[]; // `from` → `to`, so the path order is the direction
}

export interface OsmExtras {
	directions: Record<string, OsmDirection>; // official camera id → direction
	sectionPaths: OsmSectionPath[]; // official sections that get a line
}

export interface OsmSwitchProps {
	settings: OsmSettings; // the country's switch: label, texts, file (COUNTRY_OSM)
	placement: 'header' | 'pill'; // desktop header / floating pill on the mobile map
}
