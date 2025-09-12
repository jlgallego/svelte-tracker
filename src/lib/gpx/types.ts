import type { FeatureCollection } from 'geojson';

export interface AnchorPoint {
    id: string;
    lngLat: [number, number];
    marker: mapboxgl.Marker;
}

export interface GPXFile {
  id: string;
  name: string;
  content: string; // texto del archivo GPX
  geojson?: FeatureCollection | null;  // versión convertida a GeoJSON
  anchorPoints: AnchorPoint[]; // puntos de anclaje para edición
}