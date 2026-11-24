import { lazy, Suspense } from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import MapPage from '@/components/MapPage/MapPage';
import type { CountryCode } from '@/types/map';
import styles from './App.module.scss';

// Dev-only type check at /#type (VXM-003). In the build import.meta.env.DEV is false,
// so the lazy import is dropped and TypeCheck never reaches the production files.
const TypeCheck = import.meta.env.DEV
	? lazy(() => import('@/dev/TypeCheck/TypeCheck'))
	: null;
// Dev-only controls check at /#ui (VXM-010 T5), same pattern.
const UiCheck = import.meta.env.DEV
	? lazy(() => import('@/dev/UiCheck/UiCheck'))
	: null;

// Until the landing page and the router exist (VXM-017), / is the France map.
const COUNTRY: CountryCode = 'FR';

// The layout only (VXM-013 R11): header, the page, footer. The page owns its state;
// what the header and footer need from it is in the map store.
export default function App() {
	const showTypeCheck = TypeCheck && location.hash === '#type';
	const showUiCheck = UiCheck && location.hash === '#ui';

	return (
		<div className={styles.layout}>
			<Header country={COUNTRY} />
			{showTypeCheck ? (
				<Suspense>
					<TypeCheck />
				</Suspense>
			) : showUiCheck ? (
				<Suspense>
					<UiCheck />
				</Suspense>
			) : (
				<MapPage country={COUNTRY} />
			)}
			<Footer />
		</div>
	);
}
