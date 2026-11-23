import Text from '@/components/Text/Text';
import type { SwitchProps } from '@/types/controls';
import styles from './Switch.module.scss';

// On / off switch (DESIGN.md chapter 6 → Switch; VXM-010 D6): a native button with
// role="switch" - one element, keyboard (Space / Enter) and screen readers for free,
// no library. The label sits inside the button, so the whole 44 px row is clickable
// and the label is the accessible name. Used by the OSM switch, later "Turn off
// clustering".
export default function Switch({
	label,
	checked,
	onChange,
	busy = false,
	disabled = false,
	describedBy,
	className,
}: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-busy={busy || undefined}
			aria-describedby={describedBy}
			disabled={disabled || busy}
			className={
				className ? `${styles.switch} ${className}` : styles.switch
			}
			onClick={() => onChange(!checked)}
		>
			<Text variant="body-s" as="span">
				{label}
			</Text>
			<span className={styles.track} aria-hidden="true">
				<span className={styles.thumb} />
			</span>
		</button>
	);
}
