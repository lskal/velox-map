import type { TextProps, TextTag, TextVariant } from '@/types/text';
import styles from './Text.module.scss';

// Tag used when `as` is not given.
const defaultTag: Record<TextVariant, TextTag> = {
	h1: 'h1',
	h2: 'h2',
	h3: 'h3',
	h4: 'h4',
	h5: 'h5',
	h6: 'h6',
	body: 'p',
	'body-s': 'p',
	caption: 'p',
	country: 'span',
	numbers: 'span',
};

// Text in one of the DESIGN.md type styles (VXM-003). Everyday use: <Text variant="caption">.
export default function Text({
	variant = 'body',
	as,
	className,
	children,
}: TextProps) {
	const Tag = as ?? defaultTag[variant];
	const classes = className
		? `${styles[variant]} ${className}`
		: styles[variant];

	return <Tag className={classes}>{children}</Tag>;
}
