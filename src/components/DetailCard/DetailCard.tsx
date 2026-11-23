import { useEffect, useId, useRef } from 'react';
import CloseIcon from '@/assets/icons/CloseIcon/CloseIcon';
import Chip from '@/components/Chip/Chip';
import MarkerIcon from '@/components/MarkerIcon/MarkerIcon';
import Text from '@/components/Text/Text';
import { DIRECTION_TEXTS } from '@/config/card';
import { formatDate } from '@/lib/format';
import type { CardDirection, CardRow, DetailCardProps } from '@/types/card';
import styles from './DetailCard.module.scss';

// The detail card (VXM-011 D5; DESIGN.md chapter 6 → Detail card, board 19). Shared by
// every country: it only renders a CardContent object (lib/card/buildCard.ts).
// Not a modal: no backdrop, no focus trap - the map stays usable. Focus moves into the
// card when it opens or shows another spot; Esc or the close button → onClose.
export default function DetailCard({
	content,
	onClose,
	className,
}: DetailCardProps) {
	const titleId = useId();
	const cardRef = useRef<HTMLElement>(null);
	const spot = content.devices.map(device => device.id).join(',');
	const { source } = content;

	useEffect(() => {
		cardRef.current?.focus();
	}, [spot]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<section
			ref={cardRef}
			tabIndex={-1}
			aria-labelledby={titleId}
			className={className ? `${styles.card} ${className}` : styles.card}
		>
			<header className={styles.header}>
				<div className={styles.heading}>
					<Chip look="official">{content.badge}</Chip>
					<div className={styles.titleRow}>
						<MarkerIcon kind={content.kind} />
						<Text variant="h3" as="h2" id={titleId}>
							{content.title}
						</Text>
					</div>
					<Text variant="body-s" className={styles.place}>
						{content.numbers}
					</Text>
					{content.place && (
						<Text variant="body-s" className={styles.place}>
							{content.place}
						</Text>
					)}
				</div>
				<button
					type="button"
					className={styles.close}
					aria-label="Close"
					onClick={onClose}
				>
					<CloseIcon />
				</button>
			</header>

			{/* What every device shares - nothing left when all of it differs. */}
			{(content.rows.length > 0 || content.direction) && (
				<div className={styles.device}>
					<Rows rows={content.rows} />
					{content.direction && (
						<Direction direction={content.direction} />
					)}
				</div>
			)}

			{/* Same spot: each device's own block with only what differs from the others -
			    its rows, and its Direction when the devices don't share one (VXM-011 T5). */}
			{content.devices
				.filter(device => device.rows.length > 0 || !content.direction)
				.map(device => (
					<div key={device.id} className={styles.device}>
						<Text variant="h6" as="h3">
							{device.label}
						</Text>
						<Rows rows={device.rows} />
						{!content.direction && (
							<Direction direction={device.direction} />
						)}
					</div>
				))}

			<footer className={styles.footer}>
				{content.statusNote && (
					<Text variant="body-s" className={styles.note}>
						{content.statusNote}
					</Text>
				)}
				<Text variant="caption" className={styles.source}>
					Source: <a href={source.url}>{source.name}</a> ·{' '}
					<a href={source.licenceUrl}>{source.licence}</a>
					{source.dataAsOf && (
						<>
							{' '}
							· data as of{' '}
							<time dateTime={source.dataAsOf}>
								{formatDate(source.dataAsOf)}
							</time>
						</>
					)}
				</Text>
			</footer>
		</section>
	);
}

function Rows({ rows }: { rows: CardRow[] }) {
	if (rows.length === 0) return null;
	return (
		<dl className={styles.rows}>
			{rows.map(row => (
				<div key={row.label} className={styles.row}>
					<Text variant="caption" as="dt">
						{row.label}
					</Text>
					<Text variant="body-s" as="dd" className={styles.value}>
						{row.value}
					</Text>
				</div>
			))}
		</dl>
	);
}

// The Direction block (R7): on the card when every device shares it, else in each
// device's own block - so the chip and the note always sit with their direction.
function Direction({ direction }: { direction: CardDirection }) {
	return (
		<dl className={styles.direction}>
			<Text variant="caption" as="dt">
				Direction
			</Text>
			<dd className={styles.directionValue}>
				<Text variant="body-s" as="span" className={styles.value}>
					{direction.text}
				</Text>
				{direction.fromOsm && (
					<Chip look="community">{DIRECTION_TEXTS.osmChip}</Chip>
				)}
			</dd>
			{direction.fromOsm && direction.oneWay && (
				<Text
					variant="body-xs"
					as="dd"
					className={styles.directionNote}
				>
					{DIRECTION_TEXTS.otherWay}
				</Text>
			)}
			{direction.pathNote && (
				<Text
					variant="body-xs"
					as="dd"
					className={styles.directionNote}
				>
					{DIRECTION_TEXTS.osmPath}
				</Text>
			)}
		</dl>
	);
}
