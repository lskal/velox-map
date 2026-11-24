import type { DataStatus } from '@/types/data';

export interface MapStatusProps {
	status: DataStatus; // 'ready' shows nothing
	onRetry: () => void; // the data error card's Try again
	error?: 'data' | 'map'; // which error card (default 'data'); the map card reloads the page (VXM-013 R8, D6)
}
