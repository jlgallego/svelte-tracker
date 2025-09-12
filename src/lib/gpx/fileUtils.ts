import type { GPXFile } from './types';
import { parseGeoJSONToGpx, setTrackPoints, getTrackPoints } from '$lib/gpx'; // tu función actual
import { createRoutingUrl } from '$lib/gpx/routing';

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


// Añadir al final: routing activo (solo segmento)
export async function addPointToGpxFileSegmentRouting(
  file: GPXFile, lon: number, lat: number, profile: string, avoid: boolean): Promise<GPXFile> {
  
  const coords = getTrackPoints(file.geojson);
  if (coords.length === 0) {
    return addPointToGpxFile(file, lon, lat); // tu función ya existente
  }
  const last = coords[coords.length - 1];
  
  //console.log("Profile:", profile, "Avoid bikelanes:", avoid);
  
  const url = createRoutingUrl([last, [lon, lat]]);
  
  let segmentPoints: [number, number][] = [];
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('No routing response');

    const segmentGeojson = await resp.json();
    segmentPoints = getTrackPoints(segmentGeojson);
    
    if (segmentPoints.length < 2) {
      // Si la respuesta no es válida o hay muy pocos puntos, fallback al método básico
      return addPointToGpxFile(file, lon, lat);
    }

    //console.log("Segment points returned:", segmentPoints.length, segmentPoints);
    //console.log("URL used:", url);
  } catch (e) {
    console.error("Routing error:", e);
    return addPointToGpxFile(file, lon, lat);
  }

  const newCoords = [...coords.slice(0, -1), ...segmentPoints];
  const newGeojson = setTrackPoints(file.geojson, newCoords);
  const newContent = parseGeoJSONToGpx(newGeojson);
  return { ...file, geojson: newGeojson, content: newContent };
}

// Añadir intermedio: revolver dos segmentos
export async function addPointToGpxFileIntermediateRouting(
  file: GPXFile, index: number, lon: number, lat: number, profile: string, avoid: boolean): Promise<GPXFile> {
  const coords = getTrackPoints(file.geojson);
  const before = coords[index - 1];
  const after = coords[index];
  const point = [lon, lat];

  // segmento antes -> nuevo
  const seg1Url = createRoutingUrl([before, point], profile, avoid);
  const seg1Json = await (await fetch(seg1Url)).json();
  const seg1 = getTrackPoints(seg1Json);

  // segmento nuevo -> después
  const seg2Url = createRoutingUrl([point, after], profile, avoid);
  const seg2Json = await (await fetch(seg2Url)).json();
  const seg2 = getTrackPoints(seg2Json);

  // Unir: hasta before + seg1 (omitido primer punto) + seg2 (omitido primer punto) + resto
  const newCoords = [
    ...coords.slice(0, index),
    ...seg1.slice(1),
    ...seg2.slice(1),
    ...coords.slice(index + 1)
  ];
  const newGeojson = setTrackPoints(file.geojson, newCoords);
  const newContent = parseGeoJSONToGpx(newGeojson);
  return { ...file, geojson: newGeojson, content: newContent };
}

/**
 * Elimina un punto del track actualmente seleccionado
 * Devuelve un NUEVO GPXFile (no modifica el original)
 * Recibe el índice del punto a eliminar
 * @param geojson GeoJSON FeatureCollection
 * @returns Array de coordenadas [lng, lat]
 */
export function removePointFromGpxFile(file: GPXFile, index: number): GPXFile {
    if (!file.geojson) return file;

    const coords = getTrackPoints(file.geojson);

    // Eliminar el punto si el índice es válido
    if (index >= 0 && index < coords.length) {
      coords.splice(index, 1);
    }

    const newGeojson = setTrackPoints(file.geojson, coords);
    const newContent = parseGeoJSONToGpx(newGeojson);

    return {
      ...file,
      geojson: newGeojson,
      content: newContent,
    };
}