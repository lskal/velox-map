import type { Camera } from '@/types/camera';
import type { MarkerKind } from '@/types/markers';
import type { OsmExtras } from '@/types/osm';

// What the detail card shows (VXM-011 D1): one plain object between the data and the
// card. The card only renders it; each country writes the functions that fill it.

export interface CardRow {
	label: string;
	value: string;
}

// The Direction block (D2) - always shown.
export interface CardDirection {
	text: string; // "Towards north-east", "Both directions (…)", "No direction indicated"
	fromOsm: boolean; // → the "OSM data" chip
	oneWay: boolean; // one direction from OSM → "OSM indicates one direction. The camera may also check the other."
	pathNote: boolean; // a section drawn from OSM → the path note
}

// One device in the card. In a same-spot card only what differs from the other devices
// is kept here; what they share is on the card itself (VXM-011 T5).
export interface CardDevice {
	id: string;
	label: string; // "Radar ID: 12301"
	rows: CardRow[]; // the rows that differ (all rows with a value - never empty ones)
	direction: CardDirection;
}

export interface CardSource {
	name: string;
	url: string;
	licence: string;
	licenceUrl: string;
	dataAsOf: string | null; // ISO date of the data, null while unknown
}

export interface CardContent {
	badge: string; // "Official · fixed radar"
	title: string; // "Speed camera", "2 speed cameras", "2 devices"
	numbers: string; // under the title: "Radar ID: 12034", "Radar IDs: 5115-5120"
	place?: string; // optional place line - France has none (R5)
	kind: MarkerKind; // the header icon
	rows: CardRow[]; // the rows every device shares (all of them for one device)
	direction: CardDirection | null; // the shared direction; null → in each device's block
	devices: CardDevice[];
	statusNote?: string; // what a record means for this country
	source: CardSource;
}

// A country's own card texts (config/card.ts → COUNTRY_CARD_TEXTS).
export interface CountryCardTexts {
	device: { one: string; many: string }; // what a device is called: Radar ID / Radar IDs
	badge: string; // "Official · fixed radar"
	statusNote?: string; // what a record means for this country
	radarTypes?: Record<string, string>; // source type code → short meaning
}

// What a country gives the shared card builder (R12): texts + small functions.
export interface CountryCard {
	badge: string;
	statusNote?: string;
	source: Omit<CardSource, 'dataAsOf'>;
	device: { one: string; many: string }; // Radar ID / Radar IDs
	number: (camera: Camera) => string; // the device's own number in the source: "12034"
	place?: (camera: Camera) => string | undefined;
	rows: (camera: Camera) => CardRow[];
	direction: (camera: Camera, osm: OsmExtras | null) => CardDirection;
}
