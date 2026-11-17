import { useState } from 'react';
import Switch from '@/components/Switch/Switch';
import Text from '@/components/Text/Text';
import Tooltip from '@/components/Tooltip/Tooltip';
import { COUNTRY_OSM } from '@/config/osm';
import styles from './UiCheck.module.scss';

// Dev-only page: the controls and their states side by side (VXM-010 T5).
// Open localhost:5173/#ui.
export default function UiCheck() {
	const [on, setOn] = useState(false);

	return (
		<section className={styles.uiCheck} aria-label="Controls check">
			<Text variant="h6" as="h2">
				Switch
			</Text>
			<div className={styles.row}>
				<Switch
					label="Off / on (click me)"
					checked={on}
					onChange={setOn}
				/>
				<Switch label="On" checked onChange={() => {}} />
				<Switch
					label="Loading"
					checked={false}
					busy
					onChange={() => {}}
				/>
				<Switch
					label="Disabled"
					checked={false}
					disabled
					onChange={() => {}}
				/>
			</div>

			<Text variant="h6" as="h2">
				Tooltip (hover, or Tab to the switch)
			</Text>
			<div className={styles.row}>
				<Tooltip text={COUNTRY_OSM.FR!.tooltip} align="start">
					{tooltipId => (
						<Switch
							label={COUNTRY_OSM.FR!.label}
							checked={on}
							onChange={setOn}
							describedBy={tooltipId}
						/>
					)}
				</Tooltip>
			</div>
		</section>
	);
}
