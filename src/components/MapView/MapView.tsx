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
import type {
	CameraFeatureCollection,
	SectionIcon,
	SectionLineCollection,
} from '@/types/markers';
import type { OsmExtras } from '@/types/osm';
import {
	addClusterClicks,
	addMarkers,
	CAMERA_SOURCE,
	NO_CAMERAS,
} from './markers';
import {
	addSectionIcons,
	readRoadAngles,
	toSectionIconCollection,
	toSectionIcons,
	updateSectionIcons,
} from './sectionIcons';
import {
	addSectionLines,
	NO_SECTION_LINES,
	toSectionLineCollection,
	updateSectionLines,
} from './sectionLines';
import styles from './MapView.module.scss';

// MapLibre v6 with a bundler: tell it where Vite put its worker, once, before any map.
setWorkerUrl(workerUrl);

// The map (VXM-004). Named MapView - and MapLibre's Map imported as MapLibreMap - so
// nothing hides JavaScript's built-in Map.
// No zoom buttons yet: MapLibre's are 29px (below our 44px touch target); our own come later.
// Zoom with pinch, scroll, double-click or the keyboard (+ / -, arrows to pan).
// `osm`: the OSM extras while the switch is on, else null (VXM-010).
export default function MapView({
	cameras,
	osm,
}: {
	cameras: Camera[];
	osm: OsmExtras | null;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const styleUrlRef = useRef(''); // the style the map has now
	const camerasRef = useRef<CameraFeatureCollection>(NO_CAMERAS); // kept for re-adding after a theme switch
	const sectionsRef = useRef<SectionIcon[]>([]); // one-point sections (VXM-010 D1)
	const anglesRef = useRef(new Map<string, number>()); // section id → icon angle, read once
	const noRoadAtRef = useRef(new Map<string, number>()); // section id → zoom where no road was found (read again further in)
	const linesRef = useRef<SectionLineCollection>(NO_SECTION_LINES); // sections drawn along the road (VXM-010 D8)
	const drawnAsLinesRef = useRef(new Set<string>()); // their ids: no one-point icon for them
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
		map.on('style.load', () => {
			addMarkers(map, camerasRef.current, COUNTRY_MAP.FR);
			addSectionIcons(
				map,
				toSectionIconCollection(
					sectionsRef.current,
					anglesRef.current,
					drawnAsLinesRef.current,
				),
				COUNTRY_MAP.FR,
			);
			addSectionLines(map, linesRef.current, COUNTRY_MAP.FR);
		});
		addClusterClicks(map, COUNTRY_MAP.FR);

		// Section icons get the angle of the road under them once the tiles in view have
		// loaded (VXM-010 D1). setData() makes the map idle again, but then nothing is
		// left to read, so this doesn't loop.
		map.on('idle', () => {
			const { found, noRoad } = readRoadAngles(
				map,
				sectionsRef.current,
				anglesRef.current,
				noRoadAtRef.current,
				COUNTRY_MAP.FR,
			);
			if (found === 0) return;
			console.info(
				`Map: road angle read for ${found} sections at zoom ${map.getZoom().toFixed(1)} - ${noRoad} with no road within 30 m (horizontal for now)`,
			);
			updateSectionIcons(
				map,
				toSectionIconCollection(
					sectionsRef.current,
					anglesRef.current,
					drawnAsLinesRef.current,
				),
			);
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
		sectionsRef.current = toSectionIcons(features);
		const map = mapRef.current;
		if (!map) return;
		map.getSource<GeoJSONSource>(CAMERA_SOURCE)?.setData(features);
		updateSectionIcons(
			map,
			toSectionIconCollection(
				sectionsRef.current,
				anglesRef.current,
				drawnAsLinesRef.current,
			),
		);
	}, [cameras]);

	// Sections with a path become lines, their icons go (VXM-010 R9, R10); switch off →
	// no lines, icons back. The camera source isn't touched, so cluster counts stay.
	useEffect(() => {
		const paths = osm?.sectionPaths ?? [];
		linesRef.current = toSectionLineCollection(
			paths.map(({ id, path }) => ({
				id,
				path,
				direction: true, // an OSM path runs `from` → `to`
				community: true,
			})),
		);
		drawnAsLinesRef.current = new Set(paths.map(({ id }) => id));
		const map = mapRef.current;
		if (!map) return;
		updateSectionLines(map, linesRef.current);
		updateSectionIcons(
			map,
			toSectionIconCollection(
				sectionsRef.current,
				anglesRef.current,
				drawnAsLinesRef.current,
			),
		);
	}, [osm]);

	return <div ref={containerRef} className={styles.map} />;
}
