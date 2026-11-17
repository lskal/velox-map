import type { CountryCode } from '@/types/map';
import type { OsmSettings } from '@/types/osm';

// OpenStreetMap settings per country (VXM-010 D5, R13): everything that differs between
// countries lives here - the switch, the texts, the matching numbers. The decisions behind
// them: velox-map-design docs/countries.md.
export const COUNTRY_OSM: Partial<Record<CountryCode, OsmSettings>> = {
	FR: {
		mode: 'extras',
		label: 'OSM extras',
		tooltip:
			'Directions and section paths mapped by OpenStreetMap volunteers. Not official and possibly wrong. The official data is not changed.',
		noticeTitle: 'OSM extras are on',
		noticeText:
			"Directions and section paths from OpenStreetMap volunteers are now shown. They're community data, not official, and may be wrong.",
		fileUrl: '/data/osm-fr.json',
		cameraMatchMetres: 50,
		sectionMatchMetres: 300,
		directionTypes: ['speed', 'section'],
	},
};
