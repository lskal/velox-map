import type { Camera } from '@/types/camera';
import type { CameraFeature, CameraFeaturesResult } from '@/types/markers';

// Cameras → what the map's source holds (plan.md → lean GeoJSON: no details in the map).
// Cameras with exactly the same coordinates become one point (DESIGN.md → Same position):
// one camera → its type; two or more, same type or not → 'several' (VXM-007 D2, D3).
export function toCameraFeatures(cameras: Camera[]): CameraFeaturesResult {
	const spots = new Map<string, Camera[]>(); // "lng,lat" → the cameras there

	for (const camera of cameras) {
		const key = camera.position.join(',');
		const here = spots.get(key);
		if (here) {
			here.push(camera);
		} else {
			spots.set(key, [camera]);
		}
	}

	let sharedSpots = 0;
	let mixedSpots = 0;
	const shared: CameraFeaturesResult['shared'] = [];
	const features: CameraFeature[] = [];

	for (const here of spots.values()) {
		const [first] = here;
		const mixed = here.some(camera => camera.type !== first.type);
		if (here.length > 1) {
			sharedSpots++;
			shared.push({
				position: first.position,
				ids: here.map(camera => camera.id),
				types: here.map(camera => camera.type),
			});
		}
		if (mixed) mixedSpots++;

		features.push({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: first.position },
			properties: {
				id: first.id,
				type: here.length > 1 ? 'several' : first.type,
				count: here.length,
			},
		});
	}

	return {
		features: { type: 'FeatureCollection', features },
		cameras: cameras.length,
		spots: features.length,
		sharedSpots,
		mixedSpots,
		shared,
	};
}
