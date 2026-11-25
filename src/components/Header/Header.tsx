import LogoIcon from '@/assets/icons/LogoIcon/LogoIcon';
import MenuIcon from '@/assets/icons/MenuIcon/MenuIcon';
import MoonIcon from '@/assets/icons/MoonIcon/MoonIcon';
import OsmSwitch from '@/components/OsmSwitch/OsmSwitch';
import Text from '@/components/Text/Text';
import { MEDIA_DESKTOP } from '@/config/breakpoints';
import { COUNTRY_OSM } from '@/config/osm';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { HeaderProps } from '@/types/props';
import styles from './Header.module.scss';

// Page header - DESIGN.md chapter 5 "Every page".
// Language + theme are static for now (VXM-002): real, accessible elements without
// behaviour. The OSM switch reads the map store (VXM-013 R12), so a click re-renders
// the switch, not the header.
export default function Header({ country }: HeaderProps) {
	// Only mounted on desktop, not just hidden by CSS: two mounted switches would both
	// close the shared card on a click outside them (VXM-010 D7).
	const desktop = useMediaQuery(MEDIA_DESKTOP);
	const osmSettings = COUNTRY_OSM[country];

	return (
		<header className={styles.header}>
			<div className={styles.inner}>
				<a href="/" className={styles.logo}>
					<LogoIcon />
					<Text variant="logo" as="h1">
						Velox Map
					</Text>
				</a>

				{/* Desktop (768px and up): page controls (OSM switch), language + theme */}
				<div className={styles.controls}>
					{desktop && osmSettings && (
						<OsmSwitch settings={osmSettings} placement="header" />
					)}
					<select
						className={styles.select}
						name="language"
						aria-label="Language"
						defaultValue="en"
					>
						<option value="en">EN</option>
						<option value="it">IT</option>
					</select>
					<button
						type="button"
						className={styles.iconButton}
						aria-label="Switch to light mode"
					>
						<MoonIcon />
					</button>
				</div>

				{/* Mobile (below 768px): burger */}
				<button
					type="button"
					className={`${styles.iconButton} ${styles.burger}`}
					aria-label="Open menu"
					aria-expanded="false"
				>
					<MenuIcon />
				</button>
			</div>
		</header>
	);
}
