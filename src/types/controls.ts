import type { ReactNode } from 'react';

// Small interactive controls (VXM-010): Switch, Tooltip.

export interface SwitchProps {
	label: string; // visible text next to the track, also the accessible name
	checked: boolean;
	onChange: (checked: boolean) => void;
	busy?: boolean; // loading: shown disabled, aria-busy (DESIGN.md: "disabled (loading)")
	disabled?: boolean;
	describedBy?: string; // id of a description, e.g. the Tooltip's
	className?: string; // layout from the parent only
}

export interface TooltipProps {
	text: string;
	align?: 'start' | 'end'; // which edge of the trigger the card lines up with; default 'end'
	// The trigger. Gets the tooltip's id, to put in its aria-describedby.
	children: (tooltipId: string) => ReactNode;
	className?: string;
}
