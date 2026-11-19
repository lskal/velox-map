import { FR_SOURCE, fetchFRSource } from '@/lib/fetchers/fr';
import type { RawFR } from '@/types/fr';
import type { ReadyFile } from '@/types/readyFile';
import { runScript } from './runScript';
import { writeDataFile } from './writeDataFile';

// npm run data:fr - fetches the official French data and writes public/data/fr.json,
// the same file the daily job will write to Blob (VXM-010 R3a, VXM-012).
// On failure nothing is written: the previous file stays (plan.md → Data flow).

async function main() {
	console.log('France: fetching from data.gouv.fr, one page at a time…');
	const source = await fetchFRSource();
	const file: ReadyFile<RawFR> = {
		source: FR_SOURCE,
		fetchedAt: new Date().toISOString(),
		dataAsOf: source.dataAsOf,
		total: source.total,
		rows: source.rows,
	};

	if (file.rows.length !== file.total) {
		console.warn(
			`France: the source says ${file.total} rows, ${file.rows.length} arrived`,
		);
	}

	const target = await writeDataFile('fr.json', file);
	console.log(
		`France: ${file.rows.length} rows from "${source.fileTitle}" (source date ${file.dataAsOf.slice(0, 10)}) → ${target}`,
	);
}

runScript('France', main);
