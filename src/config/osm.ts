import type { CountryCode } from '@/types/map';
import type { OsmSettings } from '@/types/osm';

// OpenStreetMap settings per country (VXM-010 D5, R13): everything that differs between
// countries lives here - the switch, the texts, the matching numbers. The decisions behind
// them: velox-map-design docs/countries.md.
export const COUNTRY_OSM: Partial<Record<CountryCode, OsmSettings>> = {
	FR: {
		mode: 'extras',
		label: 'OSM extras',
		// Desktop tooltip, the mobile (i) card and the card that opens the first time the
		// switch is turned on (Max, 2026-11-17: one card, no separate notice)
		tooltip:
			'Directions and section paths mapped by OpenStreetMap volunteers. Not official and possibly wrong. The official data is not changed.',
		fileUrl: '/data/osm-fr.json',
		cameraMatchMetres: 50,
		sectionMatchMetres: 300,
		directionTypes: ['speed', 'section'],
		// Metropolitan France + Corsica, like COUNTRY_MAP.FR.bounds; the overseas
		// departments get no OSM extras for now. Neighbours' cameras in the box are
		// harmless: only those within the match distance of a French camera count.
		overpassBox: [41.3, -5.2, 51.1, 9.6],
	},
};

// The same in every country (VXM-010 D7).
export const OSM_TEXTS = {
	legalLink: { href: '/about#disclaimer', label: 'More in About → Legal' },
	errorText:
		"OSM extras couldn't be loaded. The official data is still on the map - try again later.",
};
