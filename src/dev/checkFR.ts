import { fetchFR } from '@/lib/fetchers/fr';

// Dev-only console check for the France data (VXM-005 plan D7).
// Open localhost:5173/#fr-data and read the "VXM-005 France" group in the console.

const EXAMPLE_ID = 'FR-12008'; // the normalised example in data-sources.md

async function checkFR() {
	console.info('VXM-005 France: fetching…');
	const result = await fetchFR();
	const { cameras, skipped } = result;

	// How many items per key, e.g. { speed: 2678, section: 66, … }
	const countBy = (keys: string[]) =>
		keys.reduce<Record<string, number>>((counts, key) => {
			counts[key] = (counts[key] ?? 0) + 1;
			return counts;
		}, {});

	const ids = cameras.map(camera => camera.id);
	const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
	const withoutDate = cameras.filter(
		camera => !camera.details.commissionedAt,
	);

	console.group('VXM-005 France');

	console.log('File (A1):', result.resource.title, '·', result.resource.id);
	console.log('Data as of (A1):', result.dataAsOf);
	console.log(
		'Rows (A2): total from the API',
		result.total,
		'· fetched',
		result.rowsFetched,
		result.total === result.rowsFetched ? '✅' : '❌',
	);
	console.log(
		'Cameras + skipped = fetched (A5):',
		cameras.length,
		'+',
		skipped.length,
		'=',
		cameras.length + skipped.length,
		cameras.length + skipped.length === result.rowsFetched ? '✅' : '❌',
	);
	console.log(
		'Per camera type (A4):',
		countBy(cameras.map(camera => camera.type)),
	);
	console.log(
		'Per source code (A4):',
		countBy(cameras.map(camera => camera.details.radarType)),
	);
	console.log(
		'Duplicate ids (A3):',
		duplicates.length === 0 ? 'none ✅' : duplicates,
	);
	console.log('Without a commissioning date (D5):', withoutDate.length);
	console.log(
		`${EXAMPLE_ID} (A3):`,
		JSON.stringify(
			cameras.find(camera => camera.id === EXAMPLE_ID),
			null,
			2,
		),
	);

	console.log('Skipped rows (A5):');
	console.table(
		skipped.map(({ radarNumber, reason }) => ({ radarNumber, reason })),
	);

	console.log('ETVM rows - average speed sections (A7):');
	console.table(
		cameras
			.filter(camera => camera.details.radarType === 'ETVM')
			.map(camera => ({
				id: camera.id,
				lng: camera.position[0],
				lat: camera.position[1],
				limitKph: camera.details.limitKph,
			})),
	);

	console.log('First 20 cameras (R6):');
	console.table(
		cameras.slice(0, 20).map(camera => ({
			id: camera.id,
			type: camera.type,
			code: camera.details.radarType,
			lng: camera.position[0],
			lat: camera.position[1],
			limitKph: camera.details.limitKph,
			commissionedAt: camera.details.commissionedAt,
		})),
	);

	console.groupEnd();
}

checkFR().catch(error => console.error('VXM-005 France failed:', error));
