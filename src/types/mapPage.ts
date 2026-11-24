import type { CountryCode } from '@/types/map';

export interface MapPageProps {
	country: CountryCode; // until the router (VXM-017), App passes 'FR'
}
