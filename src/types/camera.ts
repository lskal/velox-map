// The shared camera shape - plan.md → Data shape (option b). Every country's normaliser
// returns Camera objects; the map only reads the map fields, `details` is for the card.

export type CameraType =
	'speed' | 'section' | 'red_light' | 'level_crossing' | 'other';

// [lng, lat] - longitude first, as GeoJSON and MapLibre expect.
export type LngLat = [number, number];

// Country-specific popup fields. One variant per country, added in each country's ticket.
export type CameraDetails = {
	country: 'FR';
	radarType: string; // the raw code: ETF, ETD, ETT, ETU, ETVM, ETFR, ETPN
	limitKph?: number;
	commissionedAt?: string; // date put into service, YYYY-MM-DD (required or not: VXM-005 T6)
};

export interface Camera {
	id: string; // `${country}-${sourceId}`, e.g. FR-12008
	origin: 'official' | 'osm';
	type: CameraType;
	mount?: 'fixed' | 'mobile' | 'unknown'; // Italy only
	position: LngLat;
	end?: LngLat; // sections with a known end (PL, ES, NO)
	path?: LngLat[]; // full section line when the source has it (NO)
	precision: 'exact' | 'road_km' | 'town';
	details: CameraDetails;
}
