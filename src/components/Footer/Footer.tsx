import type { ReactNode } from 'react';
import Text from '@/components/Text/Text';
import { LICENCES_LINKS } from '@/config/map';
import { formatDate } from '@/lib/format';
import { useMapStore } from '@/stores/map.store';
import styles from './Footer.module.scss';

// Page footer - DESIGN.md chapter 5 (Map: notice · last update · attribution) and
// chapter 6 "Notice pill". The notice is always visible (CLAUDE.md "Never").
// The map's only attribution: MapView has none of its own (OSM, OpenMapTiles licences).
// France only until the router: the source line comes per country then (VXM-007 D9).
// The date and status come from the map store (VXM-013 R12): the footer re-renders only
// when the map page's data changes.
export default function Footer() {
	const status = useMapStore(s => s.dataStatus);
	const dataAsOf = useMapStore(s => s.dataAsOf);
	let lastUpdate: ReactNode = '…'; // still loading
	if (dataAsOf) {
		lastUpdate = <time dateTime={dataAsOf}>{formatDate(dataAsOf)}</time>;
	} else if (status === 'error') {
		lastUpdate = 'not available';
	}

	return (
		<footer className={styles.footer}>
			<div className={styles.group}>
				<Text variant="body-s" className={styles.notice}>
					Information only - not for use while driving
				</Text>
				<Text variant="caption">Last update: {lastUpdate}</Text>
			</div>
			<Text variant="caption">
				© <a href={LICENCES_LINKS.osm}>OpenStreetMap</a> contributors ·{' '}
				<a href={LICENCES_LINKS.openFreeMap}>OpenFreeMap</a> ©{' '}
				<a href={LICENCES_LINKS.openMapTiles}>OpenMapTiles</a> · Data:{' '}
				<a href={LICENCES_LINKS.source}>Ministère de l'Intérieur</a> (
				<a href={LICENCES_LINKS.licence}>Licence Ouverte 2.0</a>)
			</Text>
		</footer>
	);
}
