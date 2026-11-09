import Header from './components/Header/Header';
import styles from './App.module.scss';

export default function App() {
	return (
		<>
			<Header />
			<main className={styles.app}>
				<h1>Velox Map</h1>
			</main>
		</>
	);
}
