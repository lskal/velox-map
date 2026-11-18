import { CARD_TITLES } from '@/config/card';
import type { Camera } from '@/types/camera';
import type { CardContent, CountryCard } from '@/types/card';
import type { OsmExtras } from '@/types/osm';

// The cameras at one spot → the card content (VXM-011 D1). Shared: the country only
// gives its texts and functions (`CountryCard`), so a new country never touches this.
export function buildCard(
	cameras: Camera[],
	osm: OsmExtras | null,
	dataAsOf: string | null,
	country: CountryCard,
): CardContent | null {
	const [first] = cameras;
	if (!first) return null;

	const sameType = cameras.every(camera => camera.type === first.type);
	const title =
		cameras.length === 1
			? CARD_TITLES[first.type].one
			: `${cameras.length} ${sameType ? CARD_TITLES[first.type].many : 'devices'}`;

	return {
		badge: country.badge,
		title,
		place: country.place?.(first),
		// the same marker rule as VXM-009: one type → its shape, mixed → the grey ring
		kind: sameType ? first.type : 'several',
		devices: cameras.map(camera => ({
			id: camera.id,
			label: country.label(camera),
			rows: country.rows(camera),
			direction: country.direction(camera, osm),
		})),
		statusNote: country.statusNote,
		source: { ...country.source, dataAsOf },
	};
}
