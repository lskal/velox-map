import ClockIcon from '@/assets/icons/ClockIcon/ClockIcon';
import type { StatusNoteProps } from '@/types/statusNote';
import styles from './StatusNote.module.scss';

// A calm line under the header (DESIGN.md → Status note, VXM-012 D8): panel background,
// clock icon, no colour, no close button - it goes away by itself when the data is fresh
// again. Shared by every country; the texts come from the caller. On mobile the short text.
export default function StatusNote({ text, shortText }: StatusNoteProps) {
	return (
		<p role="status" className={styles.note}>
			<span className={styles.icon}>
				<ClockIcon />
			</span>
			<span className={styles.long}>{text}</span>
			<span className={styles.short}>{shortText}</span>
		</p>
	);
}
