import type { JobResult, JobStatus } from '../../src/types/jobs';
import { blobPath, readJson, writeJson } from './blob.js';

// The status file of a job (VXM-012 D2): data/status-<name>.json, written at the end of
// every run - also when nothing else was written - so the alert workflow (D9) always
// sees the last try and the last success.

export function statusPath(name: string): string {
	return blobPath(`data/status-${name}.json`);
}

export async function readStatus(name: string): Promise<JobStatus | null> {
	return readJson<JobStatus>(statusPath(name));
}

// Writes this run's result. A failed run keeps the previous lastSuccess, so the alert
// can tell how long a job has been failing.
export async function writeStatus(
	name: string,
	result: JobResult,
): Promise<JobStatus> {
	const now = new Date().toISOString();
	const previous = await readStatus(name);
	const status: JobStatus = {
		job: name,
		lastTry: now,
		lastSuccess: result.ok ? now : (previous?.lastSuccess ?? null),
		...result,
	};
	await writeJson(statusPath(name), status);
	return status;
}
