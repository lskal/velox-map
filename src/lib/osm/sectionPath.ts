import { distance } from '@/lib/geo';
import type { Camera, LngLat } from '@/types/camera';
import type {
	OsmSectionCounts,
	OsmSettings,
	OverpassElement,
	OverpassMember,
	OverpassRelation,
} from '@/types/osm';

// Official sections ← the path of OSM average-speed sections (VXM-010 D3, R4).
// The official point sits on one of the relation's cameras (`device`), at its start or
// its end (checked 2026-11-17), so we take the relation with a camera, `from` or `to`
// node nearest to it, within the country's distance; its road pieces must join into one
// line that passes `from` and `to`. The path runs `from` → `to`, which also gives the
// section's direction (the way traffic is checked). Sections with an official path or end are skipped
// (OSM only fills gaps, R11).

const JOIN_METRES = 5; // two road pieces touch
const ON_LINE_METRES = 50; // `from` / `to` close enough to the joined line (one was 30 m off)

const toLngLat = (point: { lat: number; lon: number }): LngLat => [
	point.lon,
	point.lat,
];

function memberPoint(
	relation: OverpassRelation,
	role: string,
): LngLat | undefined {
	const member = relation.members.find(
		(item): item is OverpassMember & { lat: number; lon: number } =>
			item.role === role &&
			item.type === 'node' &&
			item.lat !== undefined &&
			item.lon !== undefined,
	);
	return member ? toLngLat(member) : undefined;
}

// Road pieces → one line, by attaching pieces that touch either end. Pieces that never
// touch are left out; whether the line is usable is decided by `from` / `to` below.
function joinPieces(pieces: LngLat[][]): LngLat[] {
	const left = pieces.filter(piece => piece.length >= 2);
	const line = left.shift() ?? [];
	let attached = true;
	while (attached && left.length > 0) {
		attached = false;
		for (let i = 0; i < left.length; i++) {
			const piece = left[i];
			const start = line[0];
			const end = line[line.length - 1];
			const first = piece[0];
			const last = piece[piece.length - 1];
			if (distance(end, first) <= JOIN_METRES) {
				line.push(...piece.slice(1));
			} else if (distance(end, last) <= JOIN_METRES) {
				line.push(...[...piece].reverse().slice(1));
			} else if (distance(start, last) <= JOIN_METRES) {
				line.unshift(...piece.slice(0, -1));
			} else if (distance(start, first) <= JOIN_METRES) {
				line.unshift(...[...piece].reverse().slice(0, -1));
			} else {
				continue;
			}
			left.splice(i, 1);
			attached = true;
			break;
		}
	}
	return line;
}

// Index of the line point nearest to `point`, and how far it is.
function nearestIndex(line: LngLat[], point: LngLat) {
	let index = -1;
	let metres = Infinity;
	line.forEach((vertex, i) => {
		const d = distance(vertex, point);
		if (d < metres) {
			metres = d;
			index = i;
		}
	});
	return { index, metres };
}

// The relation's points: its cameras (`device`) and its `from` / `to` nodes.
function relationPoints(relation: OverpassRelation): LngLat[] {
	return relation.members
		.filter(
			(member): member is OverpassMember & { lat: number; lon: number } =>
				member.type === 'node' &&
				member.lat !== undefined &&
				member.lon !== undefined,
		)
		.map(toLngLat);
}

// One relation → its path from `from` to `to`, or null if the pieces don't allow it.
export function relationPath(relation: OverpassRelation): LngLat[] | null {
	const from = memberPoint(relation, 'from');
	const to = memberPoint(relation, 'to');
	const pieces = relation.members
		.filter(member => member.type === 'way' && member.geometry)
		.map(member => (member.geometry ?? []).map(toLngLat));
	if (!from || !to || pieces.length === 0) return null;

	const line = joinPieces(pieces);
	const start = nearestIndex(line, from);
	const end = nearestIndex(line, to);
	if (start.metres > ON_LINE_METRES || end.metres > ON_LINE_METRES)
		return null;
	if (start.index === end.index) return null;

	const path =
		start.index < end.index
			? line.slice(start.index, end.index + 1)
			: line.slice(end.index, start.index + 1).reverse();
	return [from, ...path.slice(1, -1), to];
}

export function matchSectionPaths(
	cameras: Camera[],
	overpass: OverpassElement[],
	settings: OsmSettings,
): { sections: Record<string, { path: LngLat[] }>; counts: OsmSectionCounts } {
	const relations = overpass.filter(
		(element): element is OverpassRelation => element.type === 'relation',
	);
	const official = cameras.filter(
		camera =>
			camera.type === 'section' &&
			settings.directionTypes.includes('section') &&
			!camera.path &&
			!camera.end,
	);
	const sections: Record<string, { path: LngLat[] }> = {};
	const counts: OsmSectionCounts = {
		sections: official.length,
		withPath: 0,
		notJoined: 0,
		noRelation: 0,
	};

	for (const camera of official) {
		let nearest: OverpassRelation | undefined;
		let nearestMetres = Infinity;
		for (const relation of relations) {
			const metres = Math.min(
				...relationPoints(relation).map(point =>
					distance(camera.position, point),
				),
			);
			if (metres < nearestMetres) {
				nearest = relation;
				nearestMetres = metres;
			}
		}
		if (!nearest || nearestMetres > settings.sectionMatchMetres) {
			counts.noRelation++;
			continue;
		}
		const path = relationPath(nearest);
		if (!path) {
			counts.notJoined++;
			continue;
		}
		sections[camera.id] = { path };
		counts.withPath++;
	}
	return { sections, counts };
}
