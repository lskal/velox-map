import type { ReactNode } from 'react';
import type { Camera } from '@/types/camera';
import type { CardContent } from '@/types/card';
import type { DataStatus } from '@/types/data';
import type { CountryCode } from '@/types/map';
import type { MarkerKind, SelectedSpot } from '@/types/markers';
import type { OsmExtras, OsmSettings } from '@/types/osm';

// Every component's props, in one place (VXM-013, Max 2026-11-24), A to Z by component.
// The data they carry is typed in its area's file (camera, card, osm…).

// --- Chip (VXM-011 D4) ---

export interface ChipProps {
	look: 'official' | 'community'; // green solid / dashed grey (= not official)
	children: ReactNode;
}

// --- DetailCard (VXM-011 D5) ---

export interface DetailCardProps {
	content: CardContent;
	onClose: () => void;
	className?: string; // placement from the parent
}

// --- Header ---

export interface HeaderProps {
	// The map page's country: decides the page controls before language + theme on
	// desktop, e.g. the OSM switch (VXM-010). Until the router (VXM-017), App passes 'FR'.
	country: CountryCode;
}

// --- MapPage (VXM-013) ---

export interface MapPageProps {
	country: CountryCode; // until the router (VXM-017), App passes 'FR'
}

// --- MapStatus (VXM-007) ---

export interface MapStatusProps {
	status: DataStatus; // 'ready' shows nothing
	onRetry: () => void; // the data error card's Try again
	error?: 'data' | 'map'; // which error card (default 'data'); the map card reloads the page (VXM-013 R8, D6)
}

// --- MapView (VXM-004 → VXM-013) ---

export interface MapViewProps {
	cameras: Camera[];
	osm: OsmExtras | null; // the OSM extras while the switch is on, else null (VXM-010)
	onSelect?: (spot: SelectedSpot | null) => void; // no handler → a click does nothing
	selected?: SelectedSpot | null;
	onError?: () => void; // the map couldn't start: WebGL off or the basemap blocked (VXM-013 R6, R7)
}

// --- MarkerIcon (VXM-011) ---

export interface MarkerIconProps {
	kind: MarkerKind;
	size?: number; // px, the icon's height; default 18
}

// --- OsmSwitch (VXM-010 D7) ---

export interface OsmSwitchProps {
	settings: OsmSettings; // the country's switch: label, texts, file (COUNTRY_OSM)
	placement: 'header' | 'pill'; // desktop header / floating pill on the mobile map
}

// --- StatusNote: the line under the header (VXM-012 D8, DESIGN.md → Status note) ---

export interface StatusNoteProps {
	text: string; // desktop
	shortText: string; // mobile
}

// --- Switch (VXM-010) ---

export interface SwitchProps {
	label: string; // visible text next to the track, also the accessible name
	checked: boolean;
	onChange: (checked: boolean) => void;
	busy?: boolean; // loading: shown disabled, aria-busy (DESIGN.md: "disabled (loading)")
	disabled?: boolean;
	describedBy?: string; // id of a description, e.g. the Tooltip's
	className?: string; // layout from the parent only
}

// --- Text (VXM-003) ---

// Type styles of DESIGN.md chapter 3 that <Text> can render.
export type TextVariant =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'body'
	| 'body-s'
	| 'body-xs'
	| 'caption'
	| 'logo'
	| 'country'
	| 'numbers';

// HTML tags <Text> can render.
export type TextTag =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'p'
	| 'span'
	| 'dt' // term and description of a <dl> (the detail card's rows)
	| 'dd';

export interface TextProps {
	// The look. Optional: default 'body'.
	variant?: TextVariant;
	// The tag - only for exceptions (heading level ≠ look). Default: the variant's own tag.
	as?: TextTag;
	// Layout from the parent (margins, grid placement), never type styles.
	className?: string;
	id?: string; // e.g. a card title named by aria-labelledby (VXM-011)
	children: ReactNode;
}

// --- Tooltip (VXM-010) ---

export interface TooltipProps {
	text: string;
	align?: 'start' | 'end'; // which edge of the trigger the card lines up with; default 'end'
	disabled?: boolean; // never opens, e.g. while another card explains the same thing
	// The trigger. Gets the tooltip's id, to put in its aria-describedby.
	children: (tooltipId: string) => ReactNode;
	className?: string;
}
