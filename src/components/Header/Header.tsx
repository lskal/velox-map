import LogoIcon from '@/assets/icons/LogoIcon/LogoIcon';
import MenuIcon from '@/assets/icons/MenuIcon/MenuIcon';
import MoonIcon from '@/assets/icons/MoonIcon/MoonIcon';
import styles from './Header.module.scss';

// Page header - DESIGN.md chapter 5 "Every page".
// Controls are static for now (VXM-002): real, accessible elements without behaviour.
export default function Header() {
	return (
		<header className={styles.header}>
			<div className={styles.inner}>
				<a href="/" className={styles.logo}>
					<LogoIcon />
					<span className={styles.wordmark}>VELOX MAP</span>
				</a>

				{/* Desktop (768px and up): language + theme */}
				<div className={styles.controls}>
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
