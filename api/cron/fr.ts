import type { JobCheck } from '../../src/types/jobs';
import type { RawFR, TrimmedFR } from '../../src/types/fr';
import type { ReadyFile } from '../../src/types/readyFile';
import { isAuthorized } from '../_lib/auth.js';
import {
	insideAny,
	promote,
	readCurrent,
	withinChange,
} from '../_lib/checks.js';
import { COUNTRY_BOXES } from '../_lib/config.js';
import { writeStatus } from '../_lib/status.js';
import { FR_SOURCE, fetchFRSource } from '../../src/lib/fetchers/fr.js';
import { toNumber, trimKeys } from '../../src/lib/fetchers/helpers.js';

// VXM-012 T3 (D5; R2, R3, R4) - the official French job, daily (vercel.json → schedules).
// Fetches the newest file from data.gouv.fr (fetchFRSource(): every page, each retried),
// runs the checks, and only if all pass writes data/fr.json (the previous one kept as
// data/fr.previous.json). Every run writes data/status-fr.json, success or not.
// ?accept=1 (needs the secret like every run) skips only the ±25 % check - for a real
// big change, after the alert (Max, 2026-11-19).

const JOB = 'fr';

interface CheckFailure {
	check: JobCheck;
	error: string;
}

// The checks, in order; the first one that fails stops the run.
function checkRows(
	file: ReadyFile<RawFR>,
	currentRows: number | null,
	accept: boolean,
): CheckFailure | null {
	const { rows, total } = file;
	if (rows.length === 0) {
		return { check: 'empty', error: 'the source returned no rows' };
	}
	if (rows.length !== total) {
		return {
			check: 'total',
			error: `${rows.length} rows arrived, the source says ${total}`,
		};
	}
	if (!accept && !withinChange(rows.length, currentRows)) {
		return {
			check: 'change',
			error: `${rows.length} rows, the current file has ${currentRows} - more than ±25 % (run with ?accept=1 if the change is real)`,
		};
	}

	const seen = new Set<string>();
	const duplicates: string[] = [];
	const outside: string[] = [];
	const boxes = COUNTRY_BOXES.FR ?? [];
	for (const raw of rows) {
		const row = trimKeys<TrimmedFR>(raw);
		const id = String(row['Numéro de radar'] ?? '').trim();
		if (seen.has(id)) duplicates.push(id);
		seen.add(id);
		const lat = toNumber(row.Latitude);
		const lng = toNumber(row.Longitude);
		if (!insideAny(lat, lng, boxes)) outside.push(id);
	}
	if (duplicates.length > 0) {
		return {
			check: 'unique',
			error: `${duplicates.length} radar numbers appear twice: ${duplicates.slice(0, 5).join(', ')}`,
		};
	}
	if (outside.length > 0) {
		return {
			check: 'bounds',
			error: `${outside.length} radars outside France or with no position: ${outside.slice(0, 5).join(', ')}`,
		};
	}
	return null;
}

export async function GET(request: Request): Promise<Response> {
	if (!isAuthorized(request)) {
		return new Response('Unauthorized', { status: 401 });
	}
	const accept = new URL(request.url).searchParams.get('accept') === '1';

	let file: ReadyFile<RawFR>;
	try {
		const source = await fetchFRSource();
		file = {
			source: FR_SOURCE,
			fetchedAt: new Date().toISOString(),
			dataAsOf: source.dataAsOf,
			total: source.total,
			rows: source.rows,
		};
	} catch (error) {
		// data.gouv.fr not answering, even after the retries: nothing written
		const message = error instanceof Error ? error.message : String(error);
		const status = await writeStatus(JOB, { ok: false, error: message });
		return Response.json(status, { status: 502 });
	}

	const current = await readCurrent<ReadyFile<RawFR>>(JOB);
	const counts = {
		rows: file.rows.length,
		total: file.total,
		...(current && { currentRows: current.rows.length }),
	};

	const failure = checkRows(file, current?.rows.length ?? null, accept);
	if (failure) {
		const status = await writeStatus(JOB, {
			ok: false,
			error: failure.error,
			failedCheck: failure.check,
			counts,
		});
		return Response.json(status, { status: 422 });
	}

	await promote(JOB, file);
	const status = await writeStatus(JOB, { ok: true, counts });
	return Response.json({
		...status,
		accepted: accept,
		dataAsOf: file.dataAsOf,
	});
}
