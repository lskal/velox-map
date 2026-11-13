import type { ReactNode } from 'react';
import Text from '@/components/Text/Text';
import type { FooterProps } from '@/types/footer';
import styles from './Footer.module.scss';
import { LICENCES_LINKS } from '@/config/map';

// "30 Dec 2025" - short, the same for every reader until i18n.
function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('it-IT', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

// Page footer - DESIGN.md chapter 5 (Map: notice · last update · attribution) and
// chapter 6 "Notice pill". The notice is always visible (CLAUDE.md "Never").
// The map's only attribution: MapView has none of its own (OSM, OpenMapTiles licences).
// France only until the router: the source line comes per country then (VXM-007 D9).
export default function Footer({ status, dataAsOf }: FooterProps) {
	let lastUpdate: ReactNode = '…'; // still loading
	if (dataAsOf) {
		lastUpdate = <time dateTime={dataAsOf}>{formatDate(dataAsOf)}</time>;
	} else if (status === 'error') {
		lastUpdate = 'not available';
	}

	return (
		<footer className={styles.footer}>
			<div className={styles.group}>
				<p className={styles.notice}>
					Information only - not for use while driving
				</p>
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
