import { useEffect, useState } from 'react';
import { loadFR } from '@/lib/fetchers/fr';
import type { CountryData } from '@/types/data';

// The French cameras for the page (VXM-007 plan D1): loaded once, again on retry() -
// from the ready file at /data/fr.json (VXM-012 R7). App passes the result down - map, status card and footer.
export function useFranceData(): CountryData & { retry: () => void } {
	const [data, setData] = useState<CountryData>({
		status: 'loading',
		cameras: [],
		dataAsOf: null,
		fetchedAt: null,
	});
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		// StrictMode runs this twice in dev: the first run is cancelled, its result ignored.
		let cancelled = false;

		loadFR()
			.then(result => {
				if (cancelled) return;
				if (result.skipped.length > 0) {
					console.warn(
						`France: ${result.skipped.length} rows skipped`,
						result.skipped,
					);
				}
				setData({
					status: 'ready',
					cameras: result.cameras,
					dataAsOf: result.dataAsOf,
					fetchedAt: result.fetchedAt ?? null,
				});
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				console.error('France: data could not be loaded', error);
				setData(current => ({ ...current, status: 'error' }));
			});

		return () => {
			cancelled = true;
		};
	}, [attempt]);

	const retry = () => {
		setData(current => ({ ...current, status: 'loading' }));
		setAttempt(current => current + 1);
	};

	return { ...data, retry };
}
