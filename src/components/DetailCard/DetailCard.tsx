import { useEffect, useId, useRef } from 'react';
import CloseIcon from '@/assets/icons/CloseIcon/CloseIcon';
import Chip from '@/components/Chip/Chip';
import MarkerIcon from '@/components/MarkerIcon/MarkerIcon';
import Text from '@/components/Text/Text';
import { DIRECTION_TEXTS } from '@/config/card';
import { formatDate } from '@/lib/format';
import type {
	CardDevice,
	CardDirection,
	CardRow,
	DetailCardProps,
} from '@/types/card';
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

			<div className={styles.device}>
				<Rows rows={content.rows} />
				<Direction
					shared={content.direction}
					devices={content.devices}
				/>
			</div>

			{/* Same spot: only what differs between the devices (VXM-011 T5). */}
			{content.devices
				.filter(device => device.rows.length > 0)
				.map(device => (
					<div key={device.id} className={styles.device}>
						<Text variant="h6" as="h3">
							{device.label}
						</Text>
						<Rows rows={device.rows} />
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
					<dt className={styles.label}>{row.label}</dt>
					<dd className={styles.value}>{row.value}</dd>
				</div>
			))}
		</dl>
	);
}

// The Direction block, always shown (R7): once when every device has the same
// direction, else one line per device ("Radar 5115 · Towards north").
function Direction({
	shared,
	devices,
}: {
	shared: CardDirection | null;
	devices: CardDevice[];
}) {
	const lines = shared
		? [{ id: 'shared', prefix: '', direction: shared }]
		: devices.map(device => ({
				id: device.id,
				prefix: `${device.label} · `,
				direction: device.direction,
			}));
	const all = lines.map(line => line.direction);
	return (
		<dl className={styles.direction}>
			<dt className={styles.label}>Direction</dt>
			{lines.map(({ id, prefix, direction }) => (
				<dd key={id} className={styles.directionValue}>
					<span className={styles.value}>
						{prefix}
						{direction.text}
					</span>
					{direction.fromOsm && (
						<Chip look="community">{DIRECTION_TEXTS.osmChip}</Chip>
					)}
				</dd>
			))}
			{all.some(direction => direction.fromOsm && direction.oneWay) && (
				<dd className={styles.directionNote}>
					{DIRECTION_TEXTS.otherWay}
				</dd>
			)}
			{all.some(direction => direction.pathNote) && (
				<dd className={styles.directionNote}>
					{DIRECTION_TEXTS.osmPath}
				</dd>
			)}
		</dl>
	);
}
