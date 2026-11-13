import type { DataStatus } from '@/types/data';

export interface MapStatusProps {
	status: DataStatus; // 'ready' shows nothing
	onRetry: () => void; // the error card's Try again
}
