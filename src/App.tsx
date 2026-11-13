import { lazy, Suspense } from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import MapView from '@/components/MapView/MapView';
import { useFranceData } from '@/hooks/useFranceData';
import styles from './App.module.scss';

// Dev-only type check at /#type (VXM-003). In the build import.meta.env.DEV is false,
// so the lazy import is dropped and TypeCheck never reaches the production files.
const TypeCheck = import.meta.env.DEV
	? lazy(() => import('@/dev/TypeCheck/TypeCheck'))
	: null;

export default function App() {
	const showTypeCheck = TypeCheck && location.hash === '#type';
	// Until the landing page and the router exist, / is the France map (VXM-007).
	const france = useFranceData();

	return (
		<div className={styles.layout}>
			<Header />
			<main className={styles.main}>
				{showTypeCheck ? (
					<Suspense>
						<TypeCheck />
					</Suspense>
				) : (
					<MapView cameras={france.cameras} />
				)}
			</main>
			<Footer />
		</div>
	);
}
