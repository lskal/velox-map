import { useCallback, useSyncExternalStore } from 'react';

// true while the CSS media query matches; re-renders when it changes (window resized,
// phone turned). Same pattern as useTheme().
export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const list = window.matchMedia(query);
			list.addEventListener('change', onChange);
			return () => list.removeEventListener('change', onChange);
		},
		[query],
	);
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
	);
}
