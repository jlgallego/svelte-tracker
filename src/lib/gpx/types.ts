import type { FeatureCollection } from 'geojson';

export interface GPXFile {
  id: string;
  name: string;
  content: string; // texto del archivo GPX
  geojson?: FeatureCollection | null;  // versión convertida a GeoJSON
}