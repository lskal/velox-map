import { useCallback, useEffect, useMemo, useState } from 'react';
import DetailCard from '@/components/DetailCard/DetailCard';
import MapStatus from '@/components/MapStatus/MapStatus';
import MapView from '@/components/MapView/MapView';
import OsmSwitch from '@/components/OsmSwitch/OsmSwitch';
import StatusNote from '@/components/StatusNote/StatusNote';
import { MEDIA_DESKTOP } from '@/config/breakpoints';
import { STALE_DAYS } from '@/config/data';
import { COUNTRY_OSM } from '@/config/osm';
import { useFranceData } from '@/hooks/useFranceData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOsmExtras } from '@/hooks/useOsmExtras';
import { buildCard } from '@/lib/card/buildCard';
import { COUNTRY_CARD } from '@/lib/card/countryCards';
import { isStale, staleTexts } from '@/lib/stale';
import { useMapStore } from '@/stores/map.store';
import type { MapPageProps } from '@/types/props';
import type { SelectedSpot } from '@/types/markers';
import styles from './MapPage.module.scss';

// The map page (VXM-013 R11): the country's data, the OSM extras, the selection and its
// card, the stale line, the status cards and the mobile pill. Moved from App as it was;
// only what the header and footer need goes through the map store (R12).
// The data hook is still France's: one per country comes with the other countries.
export default function MapPage({ country }: MapPageProps) {
	const data = useFranceData();
	const desktop = useMediaQuery(MEDIA_DESKTOP);
	const osmSettings = COUNTRY_OSM[country];
	const osm = useOsmExtras(osmSettings, data.cameras);

	// The footer's date and the switch's "disabled while loading" (R12): reported to the
	// store whenever they change. The store is outside React, so this is an effect's job.
	const setData = useMapStore(s => s.setData);
	const { status, dataAsOf, fetchedAt } = data;
	useEffect(() => {
		setData(status, dataAsOf);
	}, [setData, status, dataAsOf]);

	// The clicked marker and its card (VXM-011 D7) - on mobile too since VXM-013, with the
	// desktop layout until the mobile card (VXM-016).
	const [selected, setSelected] = useState<SelectedSpot | null>(null);
	const closeCard = useCallback(() => setSelected(null), []);
	// The map couldn't start (VXM-013 R8): its card wins over the data cards.
	const [mapFailed, setMapFailed] = useState(false);
	const failMap = useCallback(() => setMapFailed(true), []);

	// The cameras at that spot - the map tells which (VXM-011 T5).
	const spotCameras = useMemo(() => {
		const ids = new Set(selected?.ids);
		return data.cameras.filter(({ id }) => ids.has(id));
	}, [selected, data.cameras]);
	// Built again when the OSM switch changes, so an open card gets the direction.
	const card =
		spotCameras.length > 0
			? buildCard(spotCameras, osm, dataAsOf, COUNTRY_CARD[country])
			: null;

	// The stale-data line (VXM-012 D8): when the job hasn't written a new file for
	// STALE_DAYS days.
	const staleDays = STALE_DAYS[country];
	const staleNote =
		fetchedAt &&
		dataAsOf &&
		staleDays !== undefined &&
		isStale(fetchedAt, staleDays)
			? staleTexts(fetchedAt, dataAsOf)
			: null;

	return (
		<>
			{staleNote && <StatusNote {...staleNote} />}
			<main className={styles.main} aria-busy={status === 'loading'}>
				<MapView
					cameras={data.cameras}
					osm={osm}
					onSelect={setSelected}
					selected={selected}
					onError={failMap}
				/>
				{card && (
					<DetailCard
						content={card}
						onClose={closeCard}
						className={styles.card}
					/>
				)}
				{/* The same switch as the header's, as a pill on the mobile map (VXM-010 D7) */}
				{!desktop && osmSettings && (
					<OsmSwitch settings={osmSettings} placement="pill" />
				)}
				<MapStatus
					status={mapFailed ? 'error' : status}
					onRetry={data.retry}
					error={mapFailed ? 'map' : 'data'}
				/>
			</main>
		</>
	);
}
