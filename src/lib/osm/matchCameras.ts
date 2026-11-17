import { distance } from '@/lib/geo';
import type { Camera, LngLat } from '@/types/camera';
import type {
	OsmCameraCounts,
	OsmDirection,
	OsmSettings,
	OverpassElement,
	OverpassNode,
	OverpassWay,
} from '@/types/osm';
import { mergeDirections, parseOsmDirection, wayBearingAt } from './direction';

// Official speed cameras ← the direction of OSM speed cameras nearby (VXM-010 D3, R4).
// Plain function: official cameras + the Overpass answer in, directions + counts out.
// Only types listed in the country settings, and never a camera that already has an
// official direction (OSM only fills gaps, R11 - France has none).

const DEGREES_PER_METRE = 1 / 111_320; // quick skip before measuring

export function matchCameraDirections(
	cameras: Camera[],
	overpass: OverpassElement[],
	settings: OsmSettings,
): { directions: Record<string, OsmDirection>; counts: OsmCameraCounts } {
	const osmCameras = overpass.filter(
		(element): element is OverpassNode =>
			element.type === 'node' && element.tags?.highway === 'speed_camera',
	);
	const ways = overpass.filter(
		(element): element is OverpassWay => element.type === 'way',
	);
	const roadBearing = (node: OverpassNode) => {
		for (const way of ways) {
			const value = wayBearingAt(way, node.id);
			if (value !== undefined) return value;
		}
		return undefined;
	};

	const official = cameras.filter(
		camera =>
			camera.type !== 'section' &&
			settings.directionTypes.includes(camera.type),
	);
	const directions: Record<string, OsmDirection> = {};
	const counts: OsmCameraCounts = {
		cameras: official.length,
		withDirection: 0,
		unreadable: 0,
	};
	const reach = settings.cameraMatchMetres * DEGREES_PER_METRE * 2; // generous box

	for (const camera of official) {
		const found: OsmDirection[] = [];
		for (const node of osmCameras) {
			const value = node.tags?.direction;
			if (value === undefined) continue;
			if (
				Math.abs(node.lat - camera.position[1]) > reach ||
				Math.abs(node.lon - camera.position[0]) > reach * 2
			) {
				continue;
			}
			const position: LngLat = [node.lon, node.lat];
			if (
				distance(camera.position, position) > settings.cameraMatchMetres
			) {
				continue;
			}
			const parsed = parseOsmDirection(value, roadBearing(node));
			counts.unreadable += parsed.unreadable;
			if (parsed.direction) found.push(parsed.direction);
		}
		const merged = mergeDirections(found);
		if (merged) {
			directions[camera.id] = merged;
			counts.withDirection++;
		}
	}
	return { directions, counts };
}
