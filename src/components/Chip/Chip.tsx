import type { ChipProps } from '@/types/card';
import styles from './Chip.module.scss';

// A small label (DESIGN.md chapter 6 → Detail card): `official` = the green badge
// ("Official · fixed radar"), `community` = the dashed grey chip for data that isn't
// official ("OSM data"; later Italy's "Not official · OpenStreetMap").
export default function Chip({ look, children }: ChipProps) {
	return <span className={`${styles.chip} ${styles[look]}`}>{children}</span>;
}
