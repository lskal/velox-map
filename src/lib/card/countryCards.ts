import {
	COUNTRY_CARD_TEXTS,
	DIRECTION_TEXTS,
	PRECISION_WORDS,
} from '@/config/card';
import { LICENCES_LINKS } from '@/config/map';
import { FR_SOURCE } from '@/lib/fetchers/fr';
import { formatDate } from '@/lib/format';
import { bearing } from '@/lib/geo';
import type { Camera } from '@/types/camera';
import type { CardDirection, CardRow, CountryCard } from '@/types/card';
import type { CountryCode } from '@/types/map';
import type { OsmExtras } from '@/types/osm';
import { directionText } from './directionText';

// Each country's part of the detail card (VXM-011 D1, R12), keyed like COUNTRY_MAP and
// COUNTRY_OSM: what it calls its devices, its rows, how it reads a direction. The card
// (DetailCard) and buildCard() are shared and never change for a new country - a new
// country only adds its entry here and its texts in config/card.ts.
// If an entry grows big, it moves to its own file (countryCards/fr.ts) - not before.

const NO_DIRECTION: CardDirection = {
	text: DIRECTION_TEXTS.none,
	fromOsm: false,
	oneWay: false,
	pathNote: false,
};

// --- France ---

const TEXTS_FR = COUNTRY_CARD_TEXTS.FR;

function rowsFR(camera: Camera): CardRow[] {
	const { details } = camera;
	const meaning = TEXTS_FR.radarTypes?.[details.radarType];
	const rows: (CardRow | null)[] = [
		details.limitKph
			? { label: 'Speed limit', value: `${details.limitKph} km/h` }
			: null,
		details.radarType
			? {
					label: 'Radar type',
					value: meaning
						? `${details.radarType} · ${meaning}`
						: details.radarType,
				}
			: null,
		details.commissionedAt
			? {
					label: 'In service since',
					value: formatDate(details.commissionedAt),
				}
			: null,
		{ label: 'Position', value: PRECISION_WORDS[camera.precision] },
	];
	return rows.filter(row => row !== null);
}

// The French file has no direction: everything here comes from OSM, only while the
// switch is on (`osm` is null when off).
function directionFR(camera: Camera, osm: OsmExtras | null): CardDirection {
	if (!osm) return NO_DIRECTION;

	// A section drawn from OSM: its direction is the path's, `from` → `to`.
	const section = osm.sectionPaths.find(({ id }) => id === camera.id);
	if (section) {
		const { path } = section;
		const { text } = directionText([
			bearing(path[0], path[path.length - 1]),
		]);
		return { text, fromOsm: true, oneWay: false, pathNote: true };
	}

	const { text, oneWay } = directionText(osm.directions[camera.id]);
	if (text === DIRECTION_TEXTS.none) return NO_DIRECTION;
	return { text, fromOsm: true, oneWay, pathNote: false };
}

// --- All countries ---

export const COUNTRY_CARD: Record<CountryCode, CountryCard> = {
	FR: {
		badge: TEXTS_FR.badge,
		statusNote: TEXTS_FR.statusNote,
		source: {
			name: FR_SOURCE.name,
			url: FR_SOURCE.url,
			licence: FR_SOURCE.licence,
			licenceUrl: LICENCES_LINKS.licence,
		},
		device: TEXTS_FR.device,
		number: camera => camera.id.replace(/^FR-/, ''),
		rows: rowsFR,
		direction: directionFR,
	},
};
