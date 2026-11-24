import type { CountryCode } from '@/types/map';

export interface HeaderProps {
	// The map page's country: decides the page controls before language + theme on
	// desktop, e.g. the OSM switch (VXM-010). Until the router (VXM-017), App passes 'FR'.
	country: CountryCode;
}
