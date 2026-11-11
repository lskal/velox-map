// Helpers shared by the country fetchers (data-sources.md → Shared helpers).

// Some APIs put stray spaces in their keys ("VMA ", " Longitude") - trim them.
// T = the row shape you expect after trimming, e.g. trimKeys<TrimmedFR>(raw).
export function trimKeys<T>(raw: Record<string, unknown>): T {
	return Object.fromEntries(
		Object.entries(raw).map(([key, value]) => [key.trim(), value]),
	) as T;
}

// "+45.361" → 45.361; a number stays a number; anything else → NaN (check with Number.isNaN).
export function toNumber(value: unknown): number {
	return typeof value === 'number' ? value : parseFloat(String(value ?? ''));
}
