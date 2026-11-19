import { useSyncExternalStore } from 'react';
import { getTheme, watchTheme } from '@/lib/theme';
import type { Theme } from '@/types/theme';

// The current theme for React components; they re-render when it changes.
// useSyncExternalStore = React's built-in way to read a value that lives outside React.
export function useTheme(): Theme {
	return useSyncExternalStore(watchTheme, getTheme);
}
