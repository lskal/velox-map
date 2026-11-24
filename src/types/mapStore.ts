import type { DataStatus } from '@/types/data';
import type { OsmExtrasFile, OsmNotice, OsmStatus } from '@/types/osm';

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
