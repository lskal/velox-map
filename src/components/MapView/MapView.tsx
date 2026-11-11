import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { FRANCE_BOUNDS, MAP_STYLE_URL } from '@/config/map';
import styles from './MapView.module.scss';

// MapLibre v6 with a bundler: tell it where Vite put its worker, once, before any map.
setWorkerUrl(workerUrl);

// The map (VXM-004). Named MapView - and MapLibre's Map imported as MapLibreMap - so
// nothing hides JavaScript's built-in Map.
// No zoom buttons yet: MapLibre's are 29px (below our 44px touch target); our own come later.
// Zoom with pinch, scroll, double-click or the keyboard (+ / -, arrows to pan).
export default function MapView() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const map = new MapLibreMap({
			container: containerRef.current,
			style: MAP_STYLE_URL,
			bounds: FRANCE_BOUNDS,
			fitBoundsOptions: { padding: 16 },
			// Always expanded: the OSM / ODbL licence requires visible attribution.
			attributionControl: { compact: false },
		});

		// React StrictMode runs this effect twice in dev: removing the first map
		// here leaves exactly one.
		return () => map.remove();
	}, []);

	return <div ref={containerRef} className={styles.map} />;
}
