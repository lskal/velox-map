import { useEffect, useId, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';
import type { TooltipProps } from '@/types/controls';
import styles from './Tooltip.module.scss';

const OPEN_DELAY_MS = 300; // passing the mouse over the trigger doesn't flash it
const CLOSE_DELAY_MS = 150; // time to move from the trigger onto the card

// Desktop tooltip (DESIGN.md chapter 6 → Tooltip; VXM-010 D7). Opens on mouse hover
// (after a short delay) and on keyboard focus; stays open while the pointer is on the
// trigger or on the card itself, so it can be read (WCAG 1.4.13); closes on leave, blur
// or Esc. Never on touch - mobile uses the (i) button. The text is always in the page
// (hidden when closed), so aria-describedby works for screen readers.
export default function Tooltip({
	text,
	align = 'end',
	disabled = false,
	children,
	className,
}: TooltipProps) {
	const id = useId();
	const [open, setOpen] = useState(false);
	const timer = useRef<number | undefined>(undefined);

	const later = (next: boolean, delay: number) => {
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setOpen(next), delay);
	};
	const now = (next: boolean) => {
		window.clearTimeout(timer.current);
		setOpen(next);
	};
	useEffect(() => () => window.clearTimeout(timer.current), []);

	const onPointerEnter = (event: PointerEvent) => {
		if (event.pointerType === 'mouse') later(true, OPEN_DELAY_MS);
	};
	const onPointerLeave = (event: PointerEvent) => {
		if (event.pointerType === 'mouse') later(false, CLOSE_DELAY_MS);
	};
	// Only keyboard focus opens it: a tap also focuses the button, but not :focus-visible.
	const onFocus = (event: FocusEvent) => {
		if ((event.target as HTMLElement).matches(':focus-visible')) now(true);
	};
	const onBlur = () => now(false);
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && open) {
			event.stopPropagation();
			now(false);
		}
	};

	const wrapper = className
		? `${styles.wrapper} ${className}`
		: styles.wrapper;

	return (
		<span
			className={wrapper}
			onPointerEnter={onPointerEnter}
			onPointerLeave={onPointerLeave}
			onFocus={onFocus}
			onBlur={onBlur}
			onKeyDown={onKeyDown}
		>
			{children(id)}
			<span
				id={id}
				role="tooltip"
				hidden={!open || disabled}
				className={`${styles.card} ${styles[align]}`}
			>
				{text}
			</span>
		</span>
	);
}
