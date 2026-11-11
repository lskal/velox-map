import type { Theme } from '@/types/theme';

// The theme lives in one place: <html data-theme>. All the CSS reads it; this file is
// the only code that changes it (VXM-006 plan D6). Dark by default (no attribute);
// light only when the user chose it - the system setting is not used.

const STORAGE_KEY = 'velox-theme';

export function getTheme(): Theme {
	return document.documentElement.dataset.theme === 'light'
		? 'light'
		: 'dark';
}

function applyTheme(theme: Theme): void {
	if (theme === 'light') {
		document.documentElement.dataset.theme = 'light';
	} else {
		delete document.documentElement.dataset.theme;
	}
}

// The only way to change the theme: updates <html> and remembers the choice.
export function setTheme(theme: Theme): void {
	applyTheme(theme);
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// Storage blocked (private mode…): the theme works, it just isn't remembered.
	}
}

// Calls onChange whenever data-theme changes (setTheme, devtools…). Returns a stop function.
export function watchTheme(onChange: () => void): () => void {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	});
	return () => observer.disconnect();
}

// On load: restore the saved choice before React draws anything (this file is imported
// before the first render). Someone who chose light may see a short dark flash on reload -
// accepted, so there's no code in index.html (Max, 2026-11-11).
try {
	if (localStorage.getItem(STORAGE_KEY) === 'light') applyTheme('light');
} catch {
	// Storage blocked: stay dark.
}

// Dev only: setTheme('light') / setTheme('dark') from the browser console,
// until the theme toggle button exists.
if (import.meta.env.DEV) {
	Object.assign(window, { setTheme });
}
