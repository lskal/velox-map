import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Writes a ready data file into public/data/ (ignored by git), where the dev server
// serves it (VXM-010 D2). In VXM-012 the scheduled jobs write to Vercel Blob instead -
// this is the one function that changes. Run the scripts from the repo root (npm run).
const DATA_DIR = path.resolve('public/data');

export async function writeDataFile(
	name: string,
	data: unknown,
): Promise<string> {
	await mkdir(DATA_DIR, { recursive: true });
	const target = path.join(DATA_DIR, name);
	await writeFile(target, `${JSON.stringify(data)}\n`);
	return target;
}
