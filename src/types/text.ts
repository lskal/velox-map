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
	| 'caption'
	| 'logo'
	| 'country'
	| 'numbers';

// HTML tags <Text> can render.
export type TextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

export interface TextProps {
	// The look. Optional: default 'body'.
	variant?: TextVariant;
	// The tag - only for exceptions (heading level ≠ look). Default: the variant's own tag.
	as?: TextTag;
	// Layout from the parent (margins, grid placement), never type styles.
	className?: string;
	children: ReactNode;
}
