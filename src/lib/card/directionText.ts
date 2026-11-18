import { COMPASS_WORDS, DIRECTION_TEXTS } from '@/config/card';
import type { OsmDirection } from '@/types/osm';

// A direction → the card's words, on the 8 compass words, never bare degrees
// (VXM-011 D2, R10). Shared by every country: each country turns its own format into
// degrees or 'both' first (France: the OSM degrees from VXM-010).
//   one word                          → "Towards north-east"   (oneWay)
//   'both', or two opposite words     → "Both directions (north-east and south-west)"
//   two other words                   → "Towards north-east and south-east"
//   nothing readable                  → "No direction indicated" - the final fallback
export function directionText(input: OsmDirection | undefined): {
	text: string;
	oneWay: boolean;
} {
	if (input === 'both') return { text: DIRECTION_TEXTS.both, oneWay: false };

	// degrees → word index 0-7 (350 → 0 north, 44 → 1 north-east); same word once
	const steps = [
		...new Set(
			(input ?? [])
				.filter(Number.isFinite)
				.map(degrees => ((Math.round(degrees / 45) % 8) + 8) % 8),
		),
	].slice(0, 2);

	const [a, b] = steps.map(step => COMPASS_WORDS[step]);
	if (steps.length === 0)
		return { text: DIRECTION_TEXTS.none, oneWay: false };
	if (steps.length === 1) {
		return { text: `${DIRECTION_TEXTS.towards} ${a}`, oneWay: true };
	}
	const opposite = (steps[1] - steps[0] + 8) % 8 === 4;
	return {
		text: opposite
			? `${DIRECTION_TEXTS.both} (${a} ${DIRECTION_TEXTS.and} ${b})`
			: `${DIRECTION_TEXTS.towards} ${a} ${DIRECTION_TEXTS.and} ${b}`,
		oneWay: false,
	};
}
