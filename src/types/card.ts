import type { ReactNode } from 'react';
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
	oneWay: boolean; // one direction from OSM → "May also check the other direction."
	pathNote: boolean; // a section drawn from OSM → the path note
}

// One device in the card - a same-spot card lists several (R9).
export interface CardDevice {
	id: string;
	label: string; // the block's small label in a same-spot card, e.g. "Radar 12301"
	rows: CardRow[]; // only rows with a value - the card never checks for empty
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
	place?: string; // optional place line - France has none (R5)
	kind: MarkerKind; // the header icon
	devices: CardDevice[];
	statusNote?: string; // what a record means for this country
	source: CardSource;
}

// A country's own card texts (config/card.ts → COUNTRY_CARD_TEXTS).
export interface CountryCardTexts {
	badge: string; // "Official · fixed radar"
	statusNote?: string; // what a record means for this country
	radarTypes?: Record<string, string>; // source type code → short meaning
}

// What a country gives the shared card builder (R12): texts + small functions.
export interface CountryCard {
	badge: string;
	statusNote?: string;
	source: Omit<CardSource, 'dataAsOf'>;
	label: (camera: Camera) => string;
	place?: (camera: Camera) => string | undefined;
	rows: (camera: Camera) => CardRow[];
	direction: (camera: Camera, osm: OsmExtras | null) => CardDirection;
}

// --- Components (VXM-011 D4, D5) ---

export interface ChipProps {
	look: 'official' | 'community'; // green solid / dashed grey (= not official)
	children: ReactNode;
}

export interface MarkerIconProps {
	kind: MarkerKind;
	size?: number; // px, the icon's height; default 18
}

export interface DetailCardProps {
	content: CardContent;
	onClose: () => void;
	className?: string; // placement from the parent
}
