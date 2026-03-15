import type { CountryCode } from "@sentinel/shared-types";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface RegionHint {
  countryCode?: CountryCode;
  areaCode?: string;
  locality?: string;
}

export interface GeoCluster {
  id: string;
  label: string;
  region: RegionHint;
  centroid?: GeoPoint;
  observationCount: number;
}
