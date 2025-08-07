// src/lib/gpx/geojson.ts

import type { FeatureCollection, LineString, Feature } from 'geojson';

/**
 * Devuelve todos los puntos [lon, lat] de un track GeoJSON (FeatureCollection)
 * que contenga LineString en las features.
 * @param geojson GeoJSON FeatureCollection
 * @returns Array de coordenadas [lng, lat]
 */
export function getTrackPoints(geojson: FeatureCollection): [number, number][] {
  let points: [number, number][] = [];

  geojson.features.forEach(feature => {
    if (feature.geometry.type === "LineString") {
      points = points.concat(feature.geometry.coordinates);
    }
  });

  return points;
}

/**
 * Establece/actualiza los puntos [lng, lat] de los tracks en GeoJSON,
 * reemplazando las coordenadas de las features LineString con los nuevos puntos.
 * Retorna un nuevo FeatureCollection modificado (inmutable).
 * @param geojson GeoJSON original (inmutable)
 * @param newPoints Nuevas coordenadas [lng, lat]
 * @returns Nuevo FeatureCollection con las rutas actualizadas
 */
export function setTrackPoints(
  geojson: FeatureCollection,
  newPoints: [number, number][]
): FeatureCollection {
  // Crea una copia profunda superficial con .map
  const newFeatures = geojson.features.map(feature => {
    if (feature.geometry.type === "LineString") {
      // Reemplaza las coords por newPoints
      const newFeature: Feature<LineString> = {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: newPoints
        }
      };
      return newFeature;
    }
    return feature;
  });

  return {
    ...geojson,
    features: newFeatures
  };
}
