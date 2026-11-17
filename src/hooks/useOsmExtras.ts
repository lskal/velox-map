import { useEffect, useMemo, useState } from 'react';
import { joinExtras } from '@/lib/osm/joinExtras';
import { loadOsmFile } from '@/lib/osm/loadOsmFile';
import type { Camera } from '@/types/camera';
import type {
	OsmExtras,
	OsmExtrasFile,
	OsmExtrasState,
	OsmNotice,
	OsmSettings,
	OsmStatus,
} from '@/types/osm';

// The OSM switch's state (VXM-010 D5, D7). First "on": load the country's OSM file -
// 'loading' (the switch is busy and can't be clicked) until it's read, then 'on' and,
// the very first time in this browser, the explanation card. A failed load goes back to
// 'off' with the error card. The file is kept by loadOsmFile, so off / on again is
// instant. No store: App is the only user (same reason as VXM-007 D1).

const SEEN_KEY = 'velox:osm-notice-seen';

// localStorage can throw (private mode, blocked storage): then the card just opens
// again the next time (VXM-010 D7).
function seen(): boolean {
	try {
		return localStorage.getItem(SEEN_KEY) === '1';
	} catch {
		return false;
	}
}

function remember() {
	try {
		localStorage.setItem(SEEN_KEY, '1');
	} catch {
		// nothing to do: opens again next time
	}
}

export function useOsmExtras(
	settings: OsmSettings | undefined,
	cameras: Camera[],
): OsmExtrasState {
	const [status, setStatus] = useState<OsmStatus>('off');
	const [notice, setNotice] = useState<OsmNotice | null>(null);
	const [file, setFile] = useState<OsmExtrasFile | null>(null);

	const turnOn = (loaded: OsmExtrasFile) => {
		setFile(loaded);
		setStatus('on');
		if (!seen()) {
			setNotice('first-use');
			remember(); // shown once - there is no OK to wait for
		}
	};

	const toggle = (on: boolean) => {
		if (!settings) return;
		if (!on) {
			setStatus('off');
			setNotice(null);
			return;
		}
		setNotice(null);
		setStatus('loading');
		loadOsmFile(settings.fileUrl)
			.then(turnOn)
			.catch((error: unknown) => {
				console.error('OSM extras: file could not be loaded', error);
				setStatus('off');
				setNotice('error');
			});
	};

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

	return {
		status,
		notice,
		extras,
		toggle,
		closeNotice: () => setNotice(null),
	};
}
