import { CARD_TITLES } from '@/config/card';
import type { Camera } from '@/types/camera';
import type {
	CardContent,
	CardDevice,
	CardRow,
	CountryCard,
} from '@/types/card';
import type { OsmExtras } from '@/types/osm';

// The cameras at one spot → the card content (VXM-011 D1). Shared: the country only
// gives its texts and functions (`CountryCard`), so a new country never touches this.
// A same-spot card stays short (T5): rows and the Direction that are the same for every
// device are shown once; each device keeps only what differs.
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

	const devices: CardDevice[] = cameras.map(camera => ({
		id: camera.id,
		label: `${country.device.one}: ${country.number(camera)}`,
		rows: country.rows(camera),
		direction: country.direction(camera, osm),
	}));

	// A row is shared when every device has it with the same value.
	const same = (a: unknown, b: unknown) =>
		JSON.stringify(a) === JSON.stringify(b);
	const shared: CardRow[] = devices[0].rows.filter(row =>
		devices.every(device => device.rows.some(other => same(other, row))),
	);
	const direction = devices.every(device =>
		same(device.direction, devices[0].direction),
	)
		? devices[0].direction
		: null;

	return {
		badge: country.badge,
		title,
		numbers: numbersLine(cameras.map(country.number), country.device),
		place: country.place?.(first),
		// the same marker rule as VXM-009: one type → its shape, mixed → the grey ring
		kind: sameType ? first.type : 'several',
		rows: shared,
		direction,
		devices: devices.map(device => ({
			...device,
			rows: device.rows.filter(
				row => !shared.some(other => same(other, row)),
			),
		})),
		statusNote: country.statusNote,
		source: { ...country.source, dataAsOf },
	};
}

// "Radar ID: 12034"; "Radar IDs: 5115-5120" when the numbers follow each other; else
// "Radar IDs: 12301, 12302, 12310".
function numbersLine(numbers: string[], device: CountryCard['device']): string {
	if (numbers.length === 1) return `${device.one}: ${numbers[0]}`;
	const values = numbers.map(Number).sort((a, b) => a - b);
	const consecutive =
		values.every(Number.isInteger) &&
		values.every((value, i) => i === 0 || value === values[i - 1] + 1);
	return consecutive
		? `${device.many}: ${values[0]}-${values[values.length - 1]}`
		: `${device.many}: ${numbers.join(', ')}`;
}
