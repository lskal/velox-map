import type { LngLat } from '@/types/camera';

// Small geometry helpers for short distances (up to a few km): around one point the
// earth is treated as flat, in metres. Shared by the map (road angle, VXM-010 D1) and,
// later, the OSM matching.

const METRES_PER_DEGREE = 111_320;

// [lng, lat] → metres east and north of `origin`.
export function toLocalMetres(point: LngLat, origin: LngLat): [number, number] {
	const cosLat = Math.cos((origin[1] * Math.PI) / 180);
	return [
		(point[0] - origin[0]) * METRES_PER_DEGREE * cosLat,
		(point[1] - origin[1]) * METRES_PER_DEGREE,
	];
}

// Distance in metres between two points.
export function distance(a: LngLat, b: LngLat): number {
	return Math.hypot(...toLocalMetres(b, a));
}

// Distance in metres from `point` to the segment a - b.
export function distanceToSegment(point: LngLat, a: LngLat, b: LngLat): number {
	const [ax, ay] = toLocalMetres(a, point);
	const [bx, by] = toLocalMetres(b, point);
	const dx = bx - ax;
	const dy = by - ay;
	const lengthSquared = dx * dx + dy * dy;
	// Where the closest point sits along a → b: 0 = at a, 1 = at b.
	const t =
		lengthSquared === 0
			? 0
			: Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));
	return Math.hypot(ax + t * dx, ay + t * dy);
}

// Compass bearing from a to b in degrees: 0 = north, 90 = east.
export function bearing(a: LngLat, b: LngLat): number {
	const [x, y] = toLocalMetres(b, a);
	return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}
