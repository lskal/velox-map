import { blobPath, readJson, writeJson } from './blob.js';
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

// Where a job's files live: data/<name>.json (what the app reads) and
// data/<name>.previous.json (the backup to roll back to).
export function currentPath(name: string): string {
	return blobPath(`data/${name}.json`);
}

export function previousPath(name: string): string {
	return blobPath(`data/${name}.previous.json`);
}

// Publishes a new file: the current one becomes the previous one, then the new one
// becomes current. Call it only after every check passed.
export async function promote(name: string, data: unknown): Promise<void> {
	const current = await readJson<unknown>(currentPath(name));
	if (current !== null) await writeJson(previousPath(name), current);
	await writeJson(currentPath(name), data);
}
