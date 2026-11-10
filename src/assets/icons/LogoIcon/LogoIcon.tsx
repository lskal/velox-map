import styles from './LogoIcon.module.scss';

// Velox Map logo - DESIGN.md chapter 7, header variant (body stroke 2.2).
// Decorative: the visible "VELOX MAP" text next to it names the link.
// Size: 26px mobile / 30px desktop by default (--size-logo-icon), or pass size in px.
export default function LogoIcon({
	color = 'var(--color-accent)',
	size,
}: {
	color?: string;
	size?: number;
}) {
	return (
		<svg
			className={styles.icon}
			width={size}
			height={size}
			viewBox="0 0 32 32"
			fill="none"
			stroke={color}
			strokeWidth={2.2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="7" y="13" width="18" height="11" rx="3" />
			<circle cx="13" cy="18.5" r="3" strokeWidth={1.6} />
			<circle cx="20.5" cy="18.5" r="1.4" strokeWidth={1.1} />
			<path d="M16 24 V30" />
			<g transform="rotate(-9 16 9)">
				<path d="M7.5 11.5 Q16 9.8 24.5 11.5" />
				<path d="M11.5 10.6 V4 H20.5 V10.6" strokeWidth={1.8} />
				<path d="M11.5 8.2 H20.5" strokeWidth={1.1} />
			</g>
		</svg>
	);
}
