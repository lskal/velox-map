// A ready data file (VXM-010 D2): what the local scripts write to public/data/ now and
// the scheduled jobs write to Vercel Blob later (VXM-012). The source's rows as they
// arrived - normalising stays in the app (plan.md → Data flow).

export interface DataSource {
	name: string;
	url: string;
	licence: string;
}

export interface ReadyFile<Row> {
	source: DataSource;
	fetchedAt: string; // when the script / job fetched it (ISO)
	dataAsOf: string; // the source's own date
	total: number; // rows the source says it has
	rows: Row[];
}
