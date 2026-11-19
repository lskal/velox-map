import RetryIcon from '@/assets/icons/RetryIcon/RetryIcon';
import Text from '@/components/Text/Text';
import type { MapStatusProps } from '@/types/mapStatus';
import styles from './MapStatus.module.scss';

const SOURCE_URL =
	'https://www.data.gouv.fr/datasets/liste-des-radars-fixes-en-france/';

// Loading and error cards over the map (VXM-007 plan D8, canvas MapLoading / MapError).
export default function MapStatus({ status, onRetry }: MapStatusProps) {
	if (status === 'ready') return null;

	return (
		<div className={styles.overlay}>
			{status === 'loading' ? (
				<div
					role="status"
					className={`${styles.card} ${styles.loading}`}
				>
					<Text variant="h4" as="p">
						Loading France…
					</Text>
					<div className={styles.track} aria-hidden="true">
						<span className={styles.bar} />
					</div>
					<Text variant="caption" className={styles.muted}>
						The official source can take up to 10 seconds the first
						time.
					</Text>
				</div>
			) : (
				<section
					role="alert"
					className={`${styles.card} ${styles.error}`}
				>
					<div className={styles.title}>
						<RetryIcon />
						<Text variant="h3" as="h2" className={styles.heading}>
							France's data couldn't be loaded
						</Text>
					</div>
					<Text variant="body-s" className={styles.body}>
						The official source (Ministère de l'Intérieur on
						data.gouv.fr) didn't answer. This happens now and then:
						try again in a minute.
					</Text>
					<div>
						<button
							type="button"
							className={styles.button}
							onClick={onRetry}
						>
							Try again
						</button>
					</div>
					<Text variant="caption" className={styles.muted}>
						You can also check the source directly:{' '}
						<a href={SOURCE_URL} className={styles.link}>
							data.gouv.fr
						</a>
					</Text>
				</section>
			)}
		</div>
	);
}
