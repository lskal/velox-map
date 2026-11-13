import type { Camera } from '@/types/camera';
import type { CameraFeatureCollection } from '@/types/markers';

// Cameras → what the map's source holds: one point each, only `id` and `type`
// (plan.md → lean GeoJSON; the details stay out of the map). VXM-007 T2 adds grouping.
export function toCameraFeatures(cameras: Camera[]): CameraFeatureCollection {
	return {
		type: 'FeatureCollection',
		features: cameras.map(camera => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: camera.position },
			properties: { id: camera.id, type: camera.type },
		})),
	};
}
