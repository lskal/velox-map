import { bearing } from '@/lib/geo';
import type { LngLat } from '@/types/camera';
import type { OsmDirection, OverpassWay } from '@/types/osm';

// OSM `direction` values → compass degrees (VXM-010 D3). The tag can hold: degrees
// ("45"), compass letters ("NE"), "forward" / "backward" (along / against the road way
// the node sits on), "both", or several values separated by ";".

// prettier-ignore
const COMPASS = [
	'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
	'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export interface ParsedDirection {
	direction: OsmDirection | null; // null = nothing readable
	unreadable: number; // values that couldn't be read
}

// `roadBearing` = bearing of the road way at the camera, if it sits on one (for
// forward / backward).
export function parseOsmDirection(
	value: string,
	roadBearing?: number,
): ParsedDirection {
	const degrees: number[] = [];
	let both = false;
	let unreadable = 0;

	for (const raw of value.split(';')) {
		const part = raw.trim();
		const upper = part.toUpperCase();
		if (part === '') continue;
		const number = Number(part);
		if (upper === 'BOTH') {
			both = true;
		} else if (Number.isFinite(number)) {
			degrees.push(((number % 360) + 360) % 360);
		} else if (COMPASS.includes(upper)) {
			degrees.push(COMPASS.indexOf(upper) * 22.5);
		} else if (upper === 'FORWARD' && roadBearing !== undefined) {
			degrees.push(roadBearing);
		} else if (upper === 'BACKWARD' && roadBearing !== undefined) {
			degrees.push((roadBearing + 180) % 360);
		} else {
			unreadable++;
		}
	}

	// "forward;backward" is both directions too.
	if (both || isOpposite(degrees)) return { direction: 'both', unreadable };
	return {
		direction: degrees.length > 0 ? unique(degrees) : null,
		unreadable,
	};
}

// Two values about 180° apart (± 20°).
function isOpposite(degrees: number[]): boolean {
	if (degrees.length !== 2) return false;
	return angleBetween(degrees[0], degrees[1]) >= 180 - SAME_DIRECTION_DEGREES;
}

// Values less than 20° apart are the same direction (e.g. 344 and 343 from two OSM
// cameras at one spot, seen 2026-11-17); the first one is kept.
const SAME_DIRECTION_DEGREES = 20;

function angleBetween(a: number, b: number): number {
	const diff = Math.abs(a - b) % 360;
	return Math.min(diff, 360 - diff);
}

function unique(degrees: number[]): number[] {
	const kept: number[] = [];
	for (const value of degrees.map(Math.round)) {
		if (
			kept.every(
				other => angleBetween(other, value) >= SAME_DIRECTION_DEGREES,
			)
		) {
			kept.push(value);
		}
	}
	return kept;
}

// Bearing of a road way at one of its nodes: the segment leaving the node (or arriving,
// at the way's last node). undefined if the node isn't on the way.
export function wayBearingAt(
	way: OverpassWay,
	nodeId: number,
): number | undefined {
	const index = way.nodes?.indexOf(nodeId) ?? -1;
	const points = way.geometry;
	if (index < 0 || !points || points.length < 2) return undefined;
	const from = Math.min(index, points.length - 2);
	const a: LngLat = [points[from].lon, points[from].lat];
	const b: LngLat = [points[from + 1].lon, points[from + 1].lat];
	return bearing(a, b);
}

// Several OSM cameras near one official camera → one direction: 'both' if any says
// both (or two opposite values), else every value once.
export function mergeDirections(
	directions: OsmDirection[],
): OsmDirection | null {
	if (directions.length === 0) return null;
	if (directions.includes('both')) return 'both';
	const degrees = directions.flatMap(direction =>
		direction === 'both' ? [] : direction,
	);
	return isOpposite(unique(degrees)) ? 'both' : unique(degrees);
}
