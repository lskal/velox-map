// A run's time budget (VXM-012 D2): every loop asks timeLeft() before the next request.
export function deadline(ms: number): { timeLeft: () => number } {
	const end = Date.now() + ms;
	return { timeLeft: () => end - Date.now() };
}

export const sleep = (ms: number) =>
	new Promise(resolve => setTimeout(resolve, ms));
