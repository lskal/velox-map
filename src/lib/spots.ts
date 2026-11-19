import { distance } from '@/lib/geo';
import type { Camera } from '@/types/camera';

// Cameras → spots: cameras within `metres` of a spot's first camera join that spot
// (VXM-011 T5; SAME_SPOT_METRES). One rule, used by the map's grouping and the card.
// Fast enough for thousands of cameras: each camera is only compared with the spots in
// its own small grid cell and the 8 around it, not with every other camera.
export function groupBySpot(cameras: Camera[], metres: number): Camera[][] {
	// Cell size in degrees, at least `metres` on the ground: latitude degrees are ~111 km
	// everywhere; longitude degrees shrink towards the poles (x4 is enough up to ~75°).
	const latCell = (metres / 111_320) * 1.5;
	const lngCell = latCell * 4;
	const grid = new Map<string, Camera[][]>(); // "x,y" → the spots starting in that cell
	const spots: Camera[][] = [];

	for (const camera of cameras) {
		const [lng, lat] = camera.position;
		const x = Math.floor(lng / lngCell);
		const y = Math.floor(lat / latCell);

		let spot: Camera[] | undefined;
		for (let dx = -1; dx <= 1 && !spot; dx++) {
			for (let dy = -1; dy <= 1 && !spot; dy++) {
				spot = grid
					.get(`${x + dx},${y + dy}`)
					?.find(
						([first]) =>
							distance(first.position, camera.position) <= metres,
					);
			}
		}

		if (spot) {
			spot.push(camera);
		} else {
			const key = `${x},${y}`;
			const here = [camera];
			spots.push(here);
			grid.set(key, [...(grid.get(key) ?? []), here]);
		}
	}
	return spots;
}
