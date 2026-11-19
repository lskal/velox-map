import { useState } from 'react';
import DetailCard from '@/components/DetailCard/DetailCard';
import Switch from '@/components/Switch/Switch';
import Text from '@/components/Text/Text';
import Tooltip from '@/components/Tooltip/Tooltip';
import { COUNTRY_OSM } from '@/config/osm';
import { buildCard } from '@/lib/card/buildCard';
import { COUNTRY_CARD } from '@/lib/card/countryCards';
import type { Camera } from '@/types/camera';
import type { OsmExtras } from '@/types/osm';
import styles from './UiCheck.module.scss';

// Dev-only page: the controls and their states side by side (VXM-010 T5).
// Open localhost:5173/#ui.

// Detail card samples (VXM-011 T2): built with the real French functions from made-up
// cameras, so the card shows what the map will show.
const sampleCamera = (
	id: string,
	type: Camera['type'],
	radarType: string,
): Camera => ({
	id,
	origin: 'official',
	type,
	position: [2.35, 48.85],
	precision: 'exact',
	details: {
		country: 'FR',
		radarType,
		limitKph: 110,
		commissionedAt: '2013-02-18',
	},
});
const SAMPLE_OSM: OsmExtras = {
	directions: { 'FR-12034': [80], 'FR-12302': [45, 120] },
	sectionPaths: [
		{
			id: 'FR-20007',
			path: [
				[2.3, 48.8],
				[2.3, 48.7],
			],
		},
	],
};
const SAMPLES = [
	{
		name: 'Switch off',
		cameras: [sampleCamera('FR-12034', 'speed', 'ETD')],
		osm: null,
	},
	{
		name: 'One OSM direction',
		cameras: [sampleCamera('FR-12034', 'speed', 'ETD')],
		osm: SAMPLE_OSM,
	},
	{
		name: 'Same spot, two OSM values that disagree',
		cameras: [
			sampleCamera('FR-12301', 'speed', 'ETF'),
			sampleCamera('FR-12302', 'speed', 'ETF'),
		],
		osm: SAMPLE_OSM,
	},
	{
		name: 'Section drawn from OSM',
		cameras: [sampleCamera('FR-20007', 'section', 'ETVM')],
		osm: SAMPLE_OSM,
	},
];

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

			<Text variant="h6" as="h2">
				Detail card (dark + light; Tab to the close button, Esc logs)
			</Text>
			<div className={styles.row}>
				{SAMPLES.map(({ name, cameras, osm }) => {
					const content = buildCard(
						cameras,
						osm,
						'2025-12-30T13:42:47Z',
						COUNTRY_CARD.FR,
					);
					return (
						<figure key={name} className={styles.sample}>
							<figcaption>
								<Text variant="caption">{name}</Text>
							</figcaption>
							{content && (
								<DetailCard
									content={content}
									onClose={() =>
										console.info(`close: ${name}`)
									}
								/>
							)}
						</figure>
					);
				})}
			</div>
		</section>
	);
}
