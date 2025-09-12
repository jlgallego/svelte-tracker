// src/lib/gpx/geojson.ts

import type { FeatureCollection, LineString, Feature } from 'geojson';

/**
 * Devuelve todos los puntos [lon, lat, elevation] de un track GeoJSON (FeatureCollection)
 * que contenga LineString en las features.
 * @param geojson GeoJSON FeatureCollection
 * @returns Array de coordenadas [lng, lat, elevation]
 */
export function getTrackPoints(geojson: FeatureCollection): [number, number, number][] {
  
  if (!geojson || !geojson.features) return [];
  let points: [number, number, number][] = [];

  geojson.features.forEach(feature => {
    if (feature.geometry.type === "LineString") {
      const coords3d = feature.geometry.coordinates.map(
        (coord: number[]) => [coord[0], coord[1], coord[2] || 0] as [number, number, number]
      );
      points = points.concat(coords3d);
    }
  });

  return points;
}

/**
 * Establece/actualiza los puntos [lng, lat] de los tracks en GeoJSON,
 * reemplazando las coordenadas de las features LineString con los nuevos puntos.
 * Retorna un nuevo FeatureCollection modificado (inmutable).
 * @param geojson GeoJSON original (inmutable)
 * @param newPoints Nuevas coordenadas [lng, lat, elevation]
 * @returns Nuevo FeatureCollection con las rutas actualizadas
 */
export function setTrackPoints(geojson: FeatureCollection, newPoints: [number, number, number][]): FeatureCollection {
  
  if (!geojson) {
    // Si geojson es null, inicializa un FeatureCollection básico con LineString vacía
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: newPoints
          }
        }
      ]
    };
  }

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

