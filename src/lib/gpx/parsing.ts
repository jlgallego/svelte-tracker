// src/lib/gpx/parsing.ts

import * as togeojson from "@mapbox/togeojson";
import type { FeatureCollection } from 'geojson';

/**
 * Convierte texto GPX (XML) a GeoJSON (FeatureCollection).
 * @param gpxText Archivo GPX en texto XML
 * @returns GeoJSON FeatureCollection o null si error
 */
export function parseGpxToGeoJSON(gpxText: string): FeatureCollection | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, "application/xml");
    const geojson = togeojson.gpx(xmlDoc);
    return geojson as FeatureCollection;
  } catch (error) {
    console.error("Error parsing GPX to GeoJSON:", error);
    return null;
  }
}

/**
 * Convierte un GeoJSON (FeatureCollection) a texto GPX (XML).
 * Solo convierte líneas tipo LineString como tracks GPX.
 * Para casos avanzados extender o usar librerías XML especializadas.
 * @param geojson GeoJSON FeatureCollection
 * @returns String GPX XML
 */
export function parseGeoJSONToGpx(geojson: FeatureCollection): string {
  let gpxTracks = "";

  geojson.features.forEach((feature, idx) => {
    if (feature.geometry.type === "LineString") {
      const coordinates = feature.geometry.coordinates;
      const trkpts = coordinates
        .map(([lon, lat]) => `    <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
        .join("\n");

      gpxTracks += `
  <trk>
    <name>Track ${idx + 1}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>`;
    }
  });

  const gpxString = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="YourAppName" xmlns="http://www.topografix.com/GPX/1/1">
${gpxTracks}
</gpx>`;

  return gpxString;
}
