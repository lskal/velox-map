import Text from '@/components/Text/Text';
import type { TextVariant } from '@/types/text';
import styles from './TypeCheck.module.scss';

// Dev-only page: every type style side by side (VXM-003 plan D7). Open localhost:5173/#type.
// The sample text is mixed case on purpose: uppercase must come from CSS.

const variants: TextVariant[] = [
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'body',
	'body-s',
	'caption',
	'logo',
	'country',
];

const sample = 'Speed cameras in France 1234 TÈŠT ąęłńśźż øæå åäö';

export default function TypeCheck() {
	return (
		<section className={styles.typeCheck} aria-label="Type check">
			<div>
				<Text variant="caption">
					h1 (as p - the page already has its h1)
				</Text>
				<Text variant="h1" as="p">
					{sample}
				</Text>
			</div>
			{variants.map(variant => (
				<div key={variant}>
					<Text variant="caption">{variant}</Text>
					<Text variant={variant}>{sample}</Text>
				</div>
			))}
			<div>
				<Text variant="caption">numbers (inside body)</Text>
				<Text>
					<Text variant="numbers">4,143</Text> devices · last update{' '}
					<Text variant="numbers">21/10/2026</Text>
				</Text>
			</div>
			<div>
				<Text variant="caption">
					plain h3, then Text h3 as h2 - must look the same
				</Text>
				<h3>{sample}</h3>
				<Text variant="h3" as="h2">
					{sample}
				</Text>
			</div>
		</section>
	);
}
