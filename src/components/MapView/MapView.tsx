import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { FRANCE_BOUNDS, MAP_STYLE_URLS } from '@/config/map';
import { useTheme } from '@/hooks/useTheme';
import { getTheme } from '@/lib/theme';
import styles from './MapView.module.scss';

// MapLibre v6 with a bundler: tell it where Vite put its worker, once, before any map.
setWorkerUrl(workerUrl);

// The map (VXM-004). Named MapView - and MapLibre's Map imported as MapLibreMap - so
// nothing hides JavaScript's built-in Map.
// No zoom buttons yet: MapLibre's are 29px (below our 44px touch target); our own come later.
// Zoom with pinch, scroll, double-click or the keyboard (+ / -, arrows to pan).
export default function MapView() {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const styleUrlRef = useRef(''); // the style the map has now
	const theme = useTheme();

	// Create the map once, with the basemap for the current theme.
	useEffect(() => {
		if (!containerRef.current) return;

		const styleUrl = MAP_STYLE_URLS[getTheme()];
		const map = new MapLibreMap({
			container: containerRef.current,
			style: styleUrl,
			bounds: FRANCE_BOUNDS,
			fitBoundsOptions: { padding: 16 },
			// Always expanded: the OSM / ODbL licence requires visible attribution.
			attributionControl: { compact: false },
		});

		mapRef.current = map;
		styleUrlRef.current = styleUrl;

		// React StrictMode runs this effect twice in dev: removing the first map
		// here leaves exactly one.
		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, []);

	// The basemap follows the page theme (VXM-006 R8). setStyle keeps the camera
	// (position, zoom, pitch); nothing happens if the style is already the right one.
	useEffect(() => {
		const styleUrl = MAP_STYLE_URLS[theme];
		if (!mapRef.current || styleUrlRef.current === styleUrl) return;
		mapRef.current.setStyle(styleUrl);
		styleUrlRef.current = styleUrl;
	}, [theme]);

	return <div ref={containerRef} className={styles.map} />;
}
