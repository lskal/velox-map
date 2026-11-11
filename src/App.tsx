import { lazy, Suspense } from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import styles from './App.module.scss';

// Dev-only type check at /#type (VXM-003). In the build import.meta.env.DEV is false,
// so the lazy import is dropped and TypeCheck never reaches the production files.
const TypeCheck = import.meta.env.DEV
	? lazy(() => import('@/dev/TypeCheck/TypeCheck'))
	: null;

export default function App() {
	return (
		<>
			<Header />
			<main className={styles.app}>
				{TypeCheck && location.hash === '#type' && (
					<Suspense>
						<TypeCheck />
					</Suspense>
				)}
			</main>
			<Footer />
		</>
	);
}
