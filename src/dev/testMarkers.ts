import type { CameraType } from '@/types/camera';
import type { CameraFeature, CameraFeatureCollection } from '@/types/markers';

// Dev only (VXM-006): one invented camera per type, in a row east-west through Lyon,
// 1° apart so they don't overlap even at country zoom. Never in the build - VXM-007
// replaces them with the real French data.

const TYPES: CameraType[] = ['speed', 'section', 'level_crossing', 'red_light'];

export const TEST_CAMERAS: CameraFeatureCollection = {
	type: 'FeatureCollection',
	features: TYPES.map(
		(type, index): CameraFeature => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [3 + index, 45.76] },
			properties: { id: `TEST-${type}`, type },
		}),
	),
};
