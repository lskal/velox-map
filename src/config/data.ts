// Where the app finds each country's ready data file (VXM-010 R3b). Served from the Blob
// store by the /data/ function (VXM-012 D3); locally the dev server forwards /data/ to the
// deployed site (vite.config.ts).
export const DATA_FILES = {
	FR: '/data/fr.json',
};
