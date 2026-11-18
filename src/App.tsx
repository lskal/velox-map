import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import DetailCard from '@/components/DetailCard/DetailCard';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import MapStatus from '@/components/MapStatus/MapStatus';
import MapView from '@/components/MapView/MapView';
import OsmSwitch from '@/components/OsmSwitch/OsmSwitch';
import { MEDIA_DESKTOP } from '@/config/breakpoints';
import { COUNTRY_OSM } from '@/config/osm';
import { useFranceData } from '@/hooks/useFranceData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOsmExtras } from '@/hooks/useOsmExtras';
import { buildCard } from '@/lib/card/buildCard';
import { COUNTRY_CARD } from '@/lib/card/countryCards';
import type { SelectedSpot } from '@/types/markers';
import styles from './App.module.scss';

// Dev-only type check at /#type (VXM-003). In the build import.meta.env.DEV is false,
// so the lazy import is dropped and TypeCheck never reaches the production files.
const TypeCheck = import.meta.env.DEV
	? lazy(() => import('@/dev/TypeCheck/TypeCheck'))
	: null;
// Dev-only controls check at /#ui (VXM-010 T5), same pattern.
const UiCheck = import.meta.env.DEV
	? lazy(() => import('@/dev/UiCheck/UiCheck'))
	: null;

export default function App() {
	const showTypeCheck = TypeCheck && location.hash === '#type';
	const showUiCheck = UiCheck && location.hash === '#ui';
	// Until the landing page and the router exist, / is the France map (VXM-007).
	const france = useFranceData();
	const desktop = useMediaQuery(MEDIA_DESKTOP);
	const osmSettings = COUNTRY_OSM.FR;
	const osm = useOsmExtras(osmSettings, france.cameras);
	// The clicked marker and its card (VXM-011 D7) - desktop only. Moves to MapPage with
	// the "MapPage + a small store" ticket (Backlog).
	const [selected, setSelected] = useState<SelectedSpot | null>(null);
	const closeCard = useCallback(() => setSelected(null), []);
	// The cameras at that spot: the same position, the same rule as the map's grouping.
	const spotCameras = useMemo(
		() =>
			selected
				? france.cameras.filter(
						({ position }) =>
							position[0] === selected.position[0] &&
							position[1] === selected.position[1],
					)
				: [],
		[selected, france.cameras],
	);
	// Built again when the OSM switch changes, so an open card gets the direction.
	const card =
		desktop && spotCameras.length > 0
			? buildCard(
					spotCameras,
					osm.extras,
					france.dataAsOf,
					COUNTRY_CARD.FR,
				)
			: null;
	// One OSM switch, in the header on desktop, on the map on mobile (VXM-010 D7).
	// Disabled while the country's data loads (DESIGN.md).
	const osmSwitch = osmSettings && (
		<OsmSwitch
			country="FR"
			settings={osmSettings}
			placement={desktop ? 'header' : 'pill'}
			state={osm}
			disabled={france.status !== 'ready'}
		/>
	);

	return (
		<div className={styles.layout}>
			<Header>{desktop && osmSwitch}</Header>
			<main
				className={styles.main}
				aria-busy={france.status === 'loading'}
			>
				{showTypeCheck ? (
					<Suspense>
						<TypeCheck />
					</Suspense>
				) : showUiCheck ? (
					<Suspense>
						<UiCheck />
					</Suspense>
				) : (
					<>
						<MapView
							cameras={france.cameras}
							osm={osm.extras}
							onSelect={desktop ? setSelected : undefined}
							selected={desktop ? selected : null}
						/>
						{card && (
							<DetailCard
								content={card}
								onClose={closeCard}
								className={styles.card}
							/>
						)}
						{!desktop && osmSwitch}
						<MapStatus
							status={france.status}
							onRetry={france.retry}
						/>
					</>
				)}
			</main>
			<Footer status={france.status} dataAsOf={france.dataAsOf} />
		</div>
	);
}
