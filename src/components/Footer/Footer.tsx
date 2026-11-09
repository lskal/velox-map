import styles from './Footer.module.scss';

// Page footer - DESIGN.md chapter 5 "Every page" and chapter 6 "Notice pill".
// The notice is always visible (CLAUDE.md "Never"). Attribution is a placeholder until the map tickets.
export default function Footer() {
	return (
		<footer className={styles.footer}>
			<p className={styles.notice}>
				Information only - not for use while driving
			</p>
			<p className={styles.attribution}>Data sources: coming soon</p>
		</footer>
	);
}
