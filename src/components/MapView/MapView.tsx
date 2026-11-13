import { useEffect, useRef } from 'react';
import {
	type GeoJSONSource,
	Map as MapLibreMap,
	setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { COUNTRY_MAP, MAP_STYLE_URLS } from '@/config/map';
import { useTheme } from '@/hooks/useTheme';
import { toCameraFeatures } from '@/lib/cameraFeatures';
import { getTheme } from '@/lib/theme';
import type { Camera } from '@/types/camera';
import type { CameraFeatureCollection } from '@/types/markers';
import {
	addClusterClicks,
	addMarkers,
	CAMERA_SOURCE,
	NO_CAMERAS,
} from './markers';
import styles from './MapView.module.scss';

// MapLibre v6 with a bundler: tell it where Vite put its worker, once, before any map.
setWorkerUrl(workerUrl);

// The map (VXM-004). Named MapView - and MapLibre's Map imported as MapLibreMap - so
// nothing hides JavaScript's built-in Map.
// No zoom buttons yet: MapLibre's are 29px (below our 44px touch target); our own come later.
// Zoom with pinch, scroll, double-click or the keyboard (+ / -, arrows to pan).
export default function MapView({ cameras }: { cameras: Camera[] }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const styleUrlRef = useRef(''); // the style the map has now
	const camerasRef = useRef<CameraFeatureCollection>(NO_CAMERAS); // kept for re-adding after a theme switch
	const theme = useTheme();

	// Create the map once, with the basemap for the current theme.
	useEffect(() => {
		if (!containerRef.current) return;

		const styleUrl = MAP_STYLE_URLS[getTheme()];
		const map = new MapLibreMap({
			container: containerRef.current,
			style: styleUrl,
			bounds: COUNTRY_MAP.FR.bounds,
			fitBoundsOptions: { padding: 16 },
			// No attribution box on the map: the footer, always visible right below it,
			// carries the full credit (OSM guidelines allow "adjacent to the map").
			attributionControl: false,
		});

		// Markers on every style load: the first one and each theme switch (VXM-006 D6).
		map.on('style.load', () =>
			addMarkers(map, camerasRef.current, COUNTRY_MAP.FR),
		);
		addClusterClicks(map, COUNTRY_MAP.FR);

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

	// The cameras into the map's source - now, and kept in the ref for the next style load.
	useEffect(() => {
		const { features, ...counts } = toCameraFeatures(cameras);
		if (counts.cameras > 0) {
			console.info(
				`Map: ${counts.cameras} cameras on ${counts.spots} spots - ${counts.sharedSpots} spots hold more than one camera, ${counts.mixedSpots} of them mix types`,
			);
			// Where they are, to look them up (lng / lat on any map, ids in the official file).
			if (counts.shared.length > 0) {
				console.table(
					counts.shared.map(spot => ({
						lng: spot.position[0],
						lat: spot.position[1],
						ids: spot.ids.join(', '),
						types: spot.types.join(', '),
					})),
				);
			}
		}
		camerasRef.current = features;
		mapRef.current
			?.getSource<GeoJSONSource>(CAMERA_SOURCE)
			?.setData(features);
	}, [cameras]);

	return <div ref={containerRef} className={styles.map} />;
}
