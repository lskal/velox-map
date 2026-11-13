import type { LngLatBoundsLike } from 'maplibre-gl';

// Map settings per country (VXM-007 plan D7). France gets the first values; with more
// countries we find defaults that suit most of them and keep the exceptions here.
export interface CountryMapSettings {
	bounds: LngLatBoundsLike; // the starting view
	clustered: boolean; // false = every camera as a marker (users' switch, later)
	markerMinZoom: number; // single markers from this zoom; below it, only clusters
	clusterRadius: number; // px: how close points must be to join a cluster
}

export type CountryCode = 'FR';
