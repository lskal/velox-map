import type { PublishResult } from '../../src/types/jobs';
import { blobPath, jobEnv, readJson, writeJson } from './blob.js';
import { MAX_CHANGE } from './config.js';

// The checks and the file swap every job shares (VXM-012 D2). Nothing country-specific
// here: each job passes its own numbers.

// True when newCount is within ±MAX_CHANGE of oldCount. No previous file (oldCount
// null) → true: the first file has nothing to compare with (R3).
export function withinChange(
	newCount: number,
	oldCount: number | null,
	maxChange = MAX_CHANGE,
): boolean {
	if (oldCount === null) return true;
	if (oldCount === 0) return newCount === 0;
	return Math.abs(newCount - oldCount) / oldCount <= maxChange;
}

// True when the point lies in one of the boxes ([south, west, north, east]).
export function insideAny(
	lat: number,
	lng: number,
	boxes: [number, number, number, number][],
): boolean {
	return boxes.some(
		([south, west, north, east]) =>
			lat >= south && lat <= north && lng >= west && lng <= east,
	);
}

// Where a job's files live: data/<name>.json (what the app reads) and
// data/<name>.previous.json (the backup to roll back to).
export function currentPath(name: string): string {
	return blobPath(`data/${name}.json`);
}

const previousPath = (name: string): string => {
	return blobPath(`data/${name}.previous.json`);
};

// The current file to compare with. Outside production, the job's own preview file if
// there is one, else production's - read-only, like the /data/ function (D11), so a
// preview run is checked against the real data.
export async function readCurrent<T>(name: string): Promise<T | null> {
	const own = await readJson<T>(currentPath(name));
	if (own !== null || jobEnv() === 'production') return own;
	return readJson<T>(`data/${name}.json`);
}

// The value without the listed top-level keys (e.g. the timestamps that always differ).
const withoutKeys = (value: unknown, ignore: readonly string[]): unknown => {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return value;
	}
	return Object.fromEntries(
		Object.entries(value).filter(([key]) => !ignore.includes(key)),
	);
};

// True when two files hold the same data, compared as text without the ignored keys
// (VXM-013 R1, D1). A different order counts as a change: in doubt we write once more,
// never skip a real change.
const sameData = (
	a: unknown,
	b: unknown,
	ignore: readonly string[] = [],
): boolean => {
	return (
		JSON.stringify(withoutKeys(a, ignore)) ===
		JSON.stringify(withoutKeys(b, ignore))
	);
};

// Publishes a new file: the current one becomes the previous one, then the new one
// becomes current. Call it only after every check passed.
export async function promote(name: string, data: unknown): Promise<void> {
	const current = await readJson<unknown>(currentPath(name));
	if (current !== null) await writeJson(previousPath(name), current);
	await writeJson(currentPath(name), data);
}

// Publishes a checked file, writing to Blob only what's needed (VXM-013 R1, D2):
// unchanged → only the current file again (its date stays fresh for the stale line and
// the OSM skip), previous keeps the last different version; changed → promote().
export async function publish(
	name: string,
	data: unknown,
	current: unknown,
	ignore: readonly string[],
): Promise<PublishResult> {
	if (current !== null && sameData(data, current, ignore)) {
		await writeJson(currentPath(name), data);
		return 'unchanged';
	}
	await promote(name, data);
	return 'changed';
}
