import type { StatusNoteProps } from '@/types/props';
import { formatDate } from './format';

// The stale-data line (VXM-012 R10b, DESIGN.md → Stale data). fetchedAt = when the job
// last wrote the file; older than `days` means the job has been failing that long.

export function isStale(
	fetchedAt: string,
	days: number,
	now = Date.now(),
): boolean {
	return now - Date.parse(fetchedAt) > days * 86_400_000;
}

// The texts, as in DESIGN.md: since when the source isn't reachable, and the data's own date.
export function staleTexts(
	fetchedAt: string,
	dataAsOf: string,
): StatusNoteProps {
	const since = formatDate(fetchedAt);
	const from = formatDate(dataAsOf);
	return {
		text: `Official source not reachable since ${since} · showing the last available data, from ${from}`,
		shortText: `Source not reachable since ${since} · showing data from ${from}`,
	};
}
