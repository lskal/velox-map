import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		// '@/…' = 'src/…' in .ts/.tsx imports (SCSS keeps relative paths). Keep in sync with "paths" in tsconfig.app.json.
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
});
