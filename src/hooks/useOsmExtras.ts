import { useState } from 'react';
import type { OsmExtrasState, OsmNotice, OsmStatus } from '@/types/osm';

// The OSM switch's state (VXM-010 D5). T6: on / off, and the explanation card that opens
// by itself the first time the switch is turned on. T7 adds loading the OSM file
// (status 'loading', the error).

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

export function useOsmExtras(): OsmExtrasState {
	const [status, setStatus] = useState<OsmStatus>('off');
	const [notice, setNotice] = useState<OsmNotice | null>(null);

	const toggle = (on: boolean) => {
		setStatus(on ? 'on' : 'off');
		if (on && !seen()) {
			setNotice('first-use');
			remember(); // shown once - there is no OK to wait for
		}
		if (!on) setNotice(null);
	};

	return { status, notice, toggle, closeNotice: () => setNotice(null) };
}
