import { SAME_SPOT_METRES } from '@/config/map';
import { groupBySpot } from '@/lib/spots';
import type { Camera } from '@/types/camera';
import type {
	CameraFeature,
	CameraFeaturesResult,
	CameraSpot,
} from '@/types/markers';

// Cameras → what the map's source holds (plan.md → lean GeoJSON: no details in the map).
// Cameras at the same spot - within SAME_SPOT_METRES (VXM-011 T5; exactly the same
// coordinates before) - become one point at the first camera's position (DESIGN.md →
// Same position): one camera → its type; two or more → 'several' (VXM-007 D2, D3).
export function toCameraFeatures(cameras: Camera[]): CameraFeaturesResult {
	const spots = groupBySpot(cameras, SAME_SPOT_METRES);
	const spotOf = new Map<string, CameraSpot>();

	let sharedSpots = 0;
	let mixedSpots = 0;
	const shared: CameraFeaturesResult['shared'] = [];
	const features: CameraFeature[] = [];

	for (const here of spots) {
		const [first] = here;
		const spot = {
			position: first.position,
			ids: here.map(camera => camera.id),
		};
		for (const id of spot.ids) spotOf.set(id, spot);
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
		spotOf,
	};
}
