import type { LngLatBoundsLike } from 'maplibre-gl';
import type { DataStatus } from '@/types/data';
import type { OsmExtrasFile, OsmNotice, OsmStatus } from '@/types/osm';

// Map settings per country (VXM-007 plan D7). France gets the first values; with more
// countries we find defaults that suit most of them and keep the exceptions here.
export interface CountryMapSettings {
	bounds: LngLatBoundsLike; // the starting view
	clustered: boolean; // false = every camera as a marker (users' switch, later)
	markerMinZoom: number; // single markers from this zoom; below it, only clusters
	clusterRadius: number; // px: how close points must be to join a cluster
	iconSize: [zoom: number, scale: number][]; // icon scale by zoom, in between it grows smoothly
}

export type CountryCode = 'FR';

// --- The map store ---

// The map store (VXM-013 R12, D8): only what crosses the layout - the OSM switch (in
// the header on desktop, a pill on the mobile map), the footer's date, and what the map
// page needs back. Everything else stays local in MapPage. No country names: the
// values are the current map page's.
export interface MapStore {
	osmStatus: OsmStatus; // the switch: off → loading → on
	osmNotice: OsmNotice | null; // the card under the switch, opened by itself
	osmFile: OsmExtrasFile | null; // loaded by the switch, joined to the cameras by MapPage
	dataStatus: DataStatus; // the switch is disabled until 'ready'; the footer's "Last update"
	dataAsOf: string | null; // the footer's date (ISO), null until loaded
	toggleOsm: (on: boolean, fileUrl: string) => void;
	closeOsmNotice: () => void;
	setData: (status: DataStatus, dataAsOf: string | null) => void; // MapPage reports its data
}
