import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/roboto-flex/wght.css';
import './styles/global.scss';
import App from './App.tsx';

// Dev-only console check for the France data at /#fr-data (VXM-005). The lazy import
// behind import.meta.env.DEV is dropped from the build, like the #type page.
if (import.meta.env.DEV && location.hash === '#fr-data') {
	void import('./dev/checkFR');
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
