import type { ReactNode } from 'react';

// Type styles of DESIGN.md chapter 3 that <Text> can render.
export type TextVariant =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'body'
	| 'body-s'
	| 'body-xs'
	| 'caption'
	| 'logo'
	| 'country'
	| 'numbers';

// HTML tags <Text> can render.
export type TextTag =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'p'
	| 'span'
	| 'dt' // term and description of a <dl> (the detail card's rows)
	| 'dd';

export interface TextProps {
	// The look. Optional: default 'body'.
	variant?: TextVariant;
	// The tag - only for exceptions (heading level ≠ look). Default: the variant's own tag.
	as?: TextTag;
	// Layout from the parent (margins, grid placement), never type styles.
	className?: string;
	id?: string; // e.g. a card title named by aria-labelledby (VXM-011)
	children: ReactNode;
}
