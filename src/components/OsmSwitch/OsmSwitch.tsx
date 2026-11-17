import { useEffect, useId, useRef, useState } from 'react';
import InfoIcon from '@/assets/icons/InfoIcon/InfoIcon';
import Switch from '@/components/Switch/Switch';
import Tooltip from '@/components/Tooltip/Tooltip';
import { OSM_TEXTS } from '@/config/osm';
import type { OsmSwitchProps } from '@/types/osm';
import styles from './OsmSwitch.module.scss';

// The OSM switch (DESIGN.md chapter 5 → Header, chapter 6; VXM-010 D7). One component,
// two places: in the header on desktop (with the Tooltip), as a floating pill on the
// mobile map (with the (i) button). Every text comes from the country's settings
// (COUNTRY_OSM), so another country only adds its config.
//
// One card explains everything (Max, 2026-11-17 - no separate notice or bottom sheet):
// the same small card opens under the switch when the (i) is tapped, by itself the first
// time the switch is turned on, and with the error text if the OSM file can't load.
// It closes with a tap / click anywhere else, Esc, or the (i) again.
export default function OsmSwitch({
	settings,
	placement,
	state,
	disabled = false,
}: OsmSwitchProps) {
	const { status, notice, toggle, closeNotice } = state;
	const [infoOpen, setInfoOpen] = useState(false);
	const cardId = useId();
	const wrapper = useRef<HTMLDivElement>(null);

	const open = infoOpen || notice !== null;
	const close = () => {
		setInfoOpen(false);
		if (notice) closeNotice();
	};

	useEffect(() => {
		if (!open) return;
		const closeOutside = (event: PointerEvent) => {
			if (!wrapper.current?.contains(event.target as Node)) close();
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};
		document.addEventListener('pointerdown', closeOutside);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('pointerdown', closeOutside);
			document.removeEventListener('keydown', closeOnEscape);
		};
	});

	const control = (describedBy?: string) => (
		<Switch
			label={settings.label}
			checked={status === 'on'}
			busy={status === 'loading'}
			disabled={disabled}
			describedBy={describedBy}
			onChange={toggle}
			className={placement === 'pill' ? styles.pillSwitch : undefined}
		/>
	);

	const error = notice === 'error';

	return (
		<div ref={wrapper} className={styles[placement]}>
			{placement === 'header' ? (
				<Tooltip text={settings.tooltip} disabled={open}>
					{control}
				</Tooltip>
			) : (
				<>
					<button
						type="button"
						className={styles.infoButton}
						aria-label={`About ${settings.label}`}
						aria-expanded={open}
						aria-controls={cardId}
						onClick={() => (open ? close() : setInfoOpen(true))}
					>
						<InfoIcon />
					</button>
					{control()}
				</>
			)}

			<section
				id={cardId}
				role={error ? 'alert' : undefined}
				aria-label={error ? undefined : `About ${settings.label}`}
				hidden={!open}
				className={styles.card}
			>
				<p className={styles.cardText}>
					{error ? OSM_TEXTS.errorText : settings.tooltip}
				</p>
				{!error && (
					<a
						href={OSM_TEXTS.legalLink.href}
						className={styles.cardLink}
					>
						{OSM_TEXTS.legalLink.label}
					</a>
				)}
			</section>
		</div>
	);
}
