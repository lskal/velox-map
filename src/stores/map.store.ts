import { create } from 'zustand';
import { loadOsmFile } from '@/lib/osm/loadOsmFile';
import type { MapStore } from '@/types/mapStore';

// The map store (VXM-013 R12, D8). Created once, when this file is first imported;
// nothing in it survives a reload - the OSM switch starts off, as before.
// Components read it with one selector per value (useMapStore(s => s.osmStatus)), so
// each re-renders only when its own value changes (plan → Risks).
//
// The OSM switch (VXM-010 D5, D7), moved here from useOsmExtras: first "on" loads the
// country's OSM file - 'loading' (the switch is busy and can't be clicked) until it's
// read, then 'on' and, the very first time in this browser, the explanation card. A
// failed load goes back to 'off' with the error card. loadOsmFile keeps the request, so
// the switch and the background prefetch (useOsmExtras) share it, and off / on again is
// instant.

const SEEN_KEY = 'velox:osm-notice-seen';

// localStorage can throw (private mode, blocked storage): then the card just opens
// again the next time (VXM-010 D7).
const seen = (): boolean => {
	try {
		return localStorage.getItem(SEEN_KEY) === '1';
	} catch {
		return false;
	}
};

const remember = () => {
	try {
		localStorage.setItem(SEEN_KEY, '1');
	} catch {
		// nothing to do: opens again next time
	}
};

export const useMapStore = create<MapStore>()(set => ({
	osmStatus: 'off',
	osmNotice: null,
	osmFile: null,
	dataStatus: 'loading',
	dataAsOf: null,

	toggleOsm: (on, fileUrl) => {
		if (!on) {
			set({ osmStatus: 'off', osmNotice: null });
			return;
		}
		set({ osmStatus: 'loading', osmNotice: null });
		loadOsmFile(fileUrl)
			.then(file => {
				const firstUse = !seen();
				if (firstUse) remember(); // shown once - there is no OK to wait for
				set({
					osmFile: file,
					osmStatus: 'on',
					osmNotice: firstUse ? 'first-use' : null,
				});
			})
			.catch((error: unknown) => {
				console.error('OSM extras: file could not be loaded', error);
				set({ osmStatus: 'off', osmNotice: 'error' });
			});
	},

	closeOsmNotice: () => set({ osmNotice: null }),

	setData: (dataStatus, dataAsOf) => set({ dataStatus, dataAsOf }),
}));
