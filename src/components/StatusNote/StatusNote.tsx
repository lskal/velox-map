import ClockIcon from '@/assets/icons/ClockIcon/ClockIcon';
import Text from '@/components/Text/Text';
import type { StatusNoteProps } from '@/types/statusNote';
import styles from './StatusNote.module.scss';

// A calm line under the header (DESIGN.md → Status note, VXM-012 D8): panel background,
// clock icon, no colour, no close button - it goes away by itself when the data is fresh
// again. Shared by every country; the texts come from the caller. Desktop: the long text
// in Body XS; mobile: the short text in Caption.
export default function StatusNote({ text, shortText }: StatusNoteProps) {
	return (
		<p role="status" className={styles.note}>
			<span className={styles.icon}>
				<ClockIcon />
			</span>
			<Text variant="body-xs" as="span" className={styles.long}>
				{text}
			</Text>
			<Text variant="caption" as="span" className={styles.short}>
				{shortText}
			</Text>
		</p>
	);
}
