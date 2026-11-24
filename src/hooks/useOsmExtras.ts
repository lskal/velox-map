import { useEffect, useMemo } from 'react';
import { joinExtras } from '@/lib/osm/joinExtras';
import { loadOsmFile } from '@/lib/osm/loadOsmFile';
import { useMapStore } from '@/stores/map.store';
import type { Camera } from '@/types/camera';
import type { OsmExtras, OsmSettings } from '@/types/osm';

// The OSM extras for the map page (VXM-010 D5, VXM-013 D9): the switch itself lives in
// the store (header and pill share it); this hook prefetches the file and joins it to
// the cameras while the switch is on. MapPage is its only user.
// Prefetch (VXM-012 D7, R8): once the country's cameras are on the map, the file is
// loaded quietly when the browser is idle, so the first "on" is usually instant. Its
// errors stay silent; turning the switch on tries again.

// When the browser has no requestIdleCallback (Safari): wait this long instead.
const PREFETCH_FALLBACK_MS = 2_000;

export function useOsmExtras(
	settings: OsmSettings | undefined,
	cameras: Camera[],
): OsmExtras | null {
	const status = useMapStore(s => s.osmStatus);
	const file = useMapStore(s => s.osmFile);

	// The prefetch: after the cameras arrived, when the browser is idle - so it never
	// competes with the official data or the first map tiles.
	const ready = cameras.length > 0;
	useEffect(() => {
		if (!settings || !ready) return;
		const prefetch = () => {
			loadOsmFile(settings.fileUrl).catch(() => {
				// silent: the switch tries again and shows the error card if it fails
			});
		};
		if (typeof window.requestIdleCallback === 'function') {
			const id = window.requestIdleCallback(prefetch, { timeout: 5_000 });
			return () => window.cancelIdleCallback(id);
		}
		const timer = window.setTimeout(prefetch, PREFETCH_FALLBACK_MS);
		return () => window.clearTimeout(timer);
	}, [settings, ready]);

	// Joined only while the switch is on; again if the cameras change (e.g. a retry).
	const extras = useMemo<OsmExtras | null>(
		() =>
			status === 'on' && file && settings
				? joinExtras(cameras, file, settings)
				: null,
		[status, file, settings, cameras],
	);

	// Dev only: the joined counts, to compare with the file's counts (VXM-010 A4).
	useEffect(() => {
		if (import.meta.env.DEV && extras) {
			console.info(
				`OSM extras: ${Object.keys(extras.directions).length} directions, ${extras.sectionPaths.length} section paths`,
			);
		}
	}, [extras]);

	return extras;
}
