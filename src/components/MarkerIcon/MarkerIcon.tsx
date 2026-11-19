import type { SVGProps } from 'react';
import {
	MARKER_LINE_WIDTH,
	MARKER_RING_WIDTH,
	MARKER_SHAPES,
} from '@/config/markers';
import type { MarkerIconProps } from '@/types/card';

// A map marker as a small inline SVG - the same paths and colours the map draws
// (config/markers.ts), so the card's header icon always matches the marker.
// Decorative: the title next to it says what it is.
export default function MarkerIcon({ kind, size = 18 }: MarkerIconProps) {
	const shape = MARKER_SHAPES[kind];
	if (!shape) return null;

	const colour = `var(${shape.colourVar})`;
	const width = (size * shape.width) / shape.height;
	const paint: SVGProps<SVGPathElement> =
		shape.draw === 'fill'
			? { fill: colour }
			: {
					fill: 'none',
					stroke: colour,
					strokeWidth:
						shape.draw === 'ring'
							? MARKER_RING_WIDTH
							: MARKER_LINE_WIDTH,
					strokeLinecap: 'round',
				};

	return (
		<svg
			width={width}
			height={size}
			viewBox={`0 0 ${shape.width} ${shape.height}`}
			aria-hidden="true"
		>
			<path d={shape.path} {...paint} />
		</svg>
	);
}
