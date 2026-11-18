import { useEffect, useId, useRef } from 'react';
import CloseIcon from '@/assets/icons/CloseIcon/CloseIcon';
import Chip from '@/components/Chip/Chip';
import MarkerIcon from '@/components/MarkerIcon/MarkerIcon';
import Text from '@/components/Text/Text';
import { DIRECTION_TEXTS } from '@/config/card';
import { formatDate } from '@/lib/format';
import type { CardDevice, DetailCardProps } from '@/types/card';
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
	const several = content.devices.length > 1;
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

			{content.devices.map(device => (
				<Device key={device.id} device={device} labelled={several} />
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

// One device: its rows, then the Direction block (always shown - R7).
function Device({
	device,
	labelled,
}: {
	device: CardDevice;
	labelled: boolean; // same-spot card: a small label per device
}) {
	const { direction } = device;
	return (
		<div className={styles.device}>
			{labelled && (
				<Text variant="h6" as="h3">
					{device.label}
				</Text>
			)}
			{device.rows.length > 0 && (
				<dl className={styles.rows}>
					{device.rows.map(row => (
						<div key={row.label} className={styles.row}>
							<dt className={styles.label}>{row.label}</dt>
							<dd className={styles.value}>{row.value}</dd>
						</div>
					))}
				</dl>
			)}
			<dl className={styles.direction}>
				<dt className={styles.label}>Direction</dt>
				<dd className={styles.directionValue}>
					<span className={styles.value}>{direction.text}</span>
					{direction.fromOsm && (
						<Chip look="community">{DIRECTION_TEXTS.osmChip}</Chip>
					)}
				</dd>
				{direction.fromOsm && direction.oneWay && (
					<dd className={styles.directionNote}>
						{DIRECTION_TEXTS.otherWay}
					</dd>
				)}
				{direction.pathNote && (
					<dd className={styles.directionNote}>
						{DIRECTION_TEXTS.osmPath}
					</dd>
				)}
			</dl>
		</div>
	);
}
