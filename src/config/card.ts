import type { Camera, CameraType } from '@/types/camera';
import type { CountryCardTexts } from '@/types/card';
import type { CountryCode } from '@/types/map';

// Detail card texts (VXM-011 D3; DESIGN.md chapter 6 → Detail card, board 19).

// The card title per type: one device, and the plural for a same-spot card ("2 speed
// cameras"); a spot with mixed types says "2 devices".
export const CARD_TITLES: Record<CameraType, { one: string; many: string }> = {
	speed: { one: 'Speed camera', many: 'speed cameras' },
	section: { one: 'Average-speed section', many: 'average-speed sections' },
	red_light: { one: 'Red light camera', many: 'red light cameras' },
	level_crossing: {
		one: 'Level crossing camera',
		many: 'level crossing cameras',
	},
	other: { one: 'Traffic camera', many: 'traffic cameras' },
};

// The Position row - how exact the official point is (shared by every country).
export const PRECISION_WORDS: Record<Camera['precision'], string> = {
	exact: 'Exact',
	road_km: 'Approximate',
	town: 'Town only',
};

// A row every country shows even when its source gives no value (Max, 2026-11-18).
export const CARD_TEXTS = {
	notIndicated: 'Not indicated',
};

export const DIRECTION_TEXTS = {
	none: 'No direction indicated',
	towards: 'Towards',
	both: 'Both directions',
	and: 'and',
	otherWay:
		'OSM indicates one direction. The camera may also check the other.',
	osmChip: 'OSM data',
	osmPath: 'Path drawn from OpenStreetMap: community data, not official.',
};

// The 8 compass words, clockwise from north (D2).
export const COMPASS_WORDS = [
	'north',
	'north-east',
	'east',
	'south-east',
	'south',
	'south-west',
	'west',
	'north-west',
];

// Each country's own card texts, keyed like COUNTRY_MAP / COUNTRY_OSM (R12). A new
// country adds its entry here and its functions in lib/card/countryCards.ts.
export const COUNTRY_CARD_TEXTS: Record<CountryCode, CountryCardTexts> = {
	// France: board 19; type meanings shortened from data-sources.md → France → Type codes
	FR: {
		device: { one: 'Radar ID', many: 'Radar IDs' },
		badge: 'Official · fixed radar',
		statusNote:
			'Fixed radar listed as in service. The official list is updated once a year, so a radar removed since then may still appear.',
		radarTypes: {
			ETF: 'classic',
			ETD: 'discriminant (tells vehicle types apart)',
			ETT: 'new generation, speed and red light',
			ETU: 'urban radar (city streets, speed and red light)',
			ETVM: 'average speed',
			ETFR: 'red light',
			ETPN: 'level crossing',
		},
	},
};
