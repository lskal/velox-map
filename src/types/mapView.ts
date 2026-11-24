import type { Camera } from '@/types/camera';
import type { SelectedSpot } from '@/types/markers';
import type { OsmExtras } from '@/types/osm';

// The map's props (VXM-004 → VXM-013).
export interface MapViewProps {
	cameras: Camera[];
	osm: OsmExtras | null; // the OSM extras while the switch is on, else null (VXM-010)
	onSelect?: (spot: SelectedSpot | null) => void; // no handler (mobile) → a click does nothing
	selected?: SelectedSpot | null;
	onError?: () => void; // the map couldn't start: WebGL off or the basemap blocked (VXM-013 R6, R7)
}
