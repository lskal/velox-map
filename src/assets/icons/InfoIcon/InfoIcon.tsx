// Info icon - the (i) next to the mobile OSM switch (canvas Components → 9).
// Decorative: the button around it has the accessible name.
export default function InfoIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 11 V16" />
			<path d="M12 8 V8.5" />
		</svg>
	);
}
