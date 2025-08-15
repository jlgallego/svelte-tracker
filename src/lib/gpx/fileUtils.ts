import type { GPXFile } from './types';
import { parseGeoJSONToGpx, setTrackPoints, getTrackPoints } from '$lib/gpx'; // tu función actual

const EMPTY_TRACK_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: []
      }
    }
  ]
};

/**
 * Añade un punto (lon, lat) antes de </trkseg> en el contenido GPX.
 * Devuelve un NUEVO GPXFile (no modifica el original)
 */
export function addPointToGpxFile(file: GPXFile, lon: number, lat: number): GPXFile {
    let gpxText = file.content;

    // Verificar si las dos primeras coordenadas son iguales en el geoJSON
    let coords = file.geojson? getTrackPoints(file.geojson) : []; 

    // === CASO INICIAL: no hay puntos → duplicamos el primero ===
    if (coords.length === 0) {
        coords.push([lon, lat], [lon, lat]); // duplicamos
    } else {
        coords.push([lon, lat]);

        // Si los 2 primeros puntos son iguales, eliminamos el duplicado
        // Esto es para evitar que la librería de geoJSON falle y no se muestre el primer punto al crear un track
        // Si hay más de 2 puntos, no hace falta eliminar duplicados
        if (coords.length >= 3) {
            const [p0, p1] = coords;
            if (p0[0] === p1[0] && p0[1] === p1[1]) {
                coords.splice(1, 1); // elimina la duplicada
            }
        }
    }

    // Actualizar geojson
    // const newGeojson = setTrackPoints(file.geojson ?? { type: 'FeatureCollection', features: [] }, coords);
    const newGeojson = setTrackPoints(file.geojson ?? EMPTY_TRACK_GEOJSON, coords);

    // Actualizar contenido GPX
    const newContent = parseGeoJSONToGpx(newGeojson);
    
    return {
        ...file,
        content: newContent,
        geojson: newGeojson
    };
}