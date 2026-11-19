import type { Camera } from '@/types/camera';
import type { OsmExtras, OsmExtrasFile, OsmSettings } from '@/types/osm';

// Joins the OSM file to the official cameras in the browser (VXM-010 D5, R11). The two
// stay separate: nothing is written into the cameras, the map and the card read the
// extras next to them. OSM only fills a gap - an id the official data doesn't have is
// ignored, and a section with its own end or path keeps it.
export function joinExtras(
	cameras: Camera[],
	file: OsmExtrasFile,
	settings: OsmSettings,
): OsmExtras {
	const extras: OsmExtras = { directions: {}, sectionPaths: [] };

	for (const camera of cameras) {
		if (camera.origin !== 'official') continue;

		const direction = file.directions[camera.id];
		if (direction && settings.directionTypes.includes(camera.type)) {
			extras.directions[camera.id] = direction;
		}

		const section = file.sections[camera.id];
		if (
			section &&
			camera.type === 'section' &&
			!camera.end &&
			!camera.path &&
			section.path.length >= 2
		) {
			extras.sectionPaths.push({ id: camera.id, path: section.path });
		}
	}

	return extras;
}
