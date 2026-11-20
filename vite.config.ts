import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The deployed site: in `npm run dev`, /data/… is forwarded there, so a fresh clone shows
// the same data files as production, without local files (VXM-012 D3, R9).
const DATA_ORIGIN = 'https://vxmap.vercel.app';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: { '/data': { target: DATA_ORIGIN, changeOrigin: true } },
	},
	resolve: {
		// '@/…' = 'src/…' in .ts/.tsx imports (SCSS keeps relative paths). Keep in sync with "paths" in tsconfig.app.json.
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
});
