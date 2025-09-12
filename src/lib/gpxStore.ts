import { writable, type Writable, get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid'; // Utiliza uuid para ids únicas
import type { GPXFile } from '$lib/gpx/types';
import { addPointToGpxFile, removePointFromGpxFile, addPointToGpxFileSegmentRouting } from '$lib/gpx/fileUtils';
import { parseGpxToGeoJSON } from '$lib/gpx'; // importa desde la librería gpx
import { appState, routingEnabled, selectedProfile, avoidCycling } from '$lib/appStateStore'; // Importa el store de estado de la aplicación



// Store para la lista de archivos GPX
export const gpxFiles: Writable<GPXFile[]> = writable([]);

// Store para el archivo actualmente seleccionado
export const selectedGpxFile: Writable<GPXFile | null> = writable(null);


// Lógica para crear un nuevo archivo GPX
// Genera un ID único y crea un archivo GPX vacío
// El nombre por defecto es "Nuevo GPX"
export function newFile(name = "Nuevo GPX") {
  const id = uuidv4();
  const emptyGpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="AppName"></gpx>`;
  //const emptyGeoJSON = { type: 'FeatureCollection', features: [] }
  
  const newFile: GPXFile = { id, name, content: emptyGpx, geojson: null };

  gpxFiles.update(files => [...files, newFile]);
  selectedGpxFile.set(newFile);
  appState.set("EDIT"); // Resetea el estado de edición al seleccionar un archivo

}

/** Añade un punto al track actualmente seleccionado */
export async function addPointToSelectedTrack(lon: number, lat: number) {
  
  const file = get(selectedGpxFile);
  if (!file) return; // No hay track seleccionado
  
  const routingOn = get(routingEnabled);
  const profile = get(selectedProfile) || 'trekking';
  const avoid = get(avoidCycling);

  let updated: GPXFile;

  // Verificar si routing está activo
  if (!routingOn) {
      // Si routing no está activo, añade el punto directamente
      updated = addPointToGpxFile(file, lon, lat);

  } else {
    updated = await addPointToGpxFileSegmentRouting(file, lon, lat, profile, avoid);
  }
  
  gpxFiles.update(files => files.map(f => (f.id === file.id ? updated : f)));
  selectedGpxFile.set(updated);
}

// Para añadir un punto intermedio
export async function addPointToSelectedTrackIntermediate(index: number, lon: number, lat: number) {
  // Similar estructura, llama a helper con lógica segmentada
}

// Para editar (drag) un punto intermedio
export async function movePointInSelectedTrack(index: number, newLon: number, newLat: number) {
  // Similar estructura, llama a helper con lógica segmentada
}


/** Elimina un punto del track actualmente seleccionado */
export function removePointFromSelectedTrack(index: number) {
    const file = get(selectedGpxFile);
    if (!file.geojson) return file;
    
    const updated = removePointFromGpxFile(file, index);
    
    gpxFiles.update(files =>
      files.map(f => (f.id === updated.id ? updated : f))
    );
    selectedGpxFile.set(updated);
}

// Lógica para abrir el diálogo de selección y cargar archivos
export function triggerFileInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.gpx';
  input.multiple = true;
  input.className = 'hidden';

  input.onchange = () => {
    if (input.files) {
      loadFiles(input.files);
    }
  };

  input.click();
}

export async function loadFiles(list: FileList | File[]) {
  const loadedFiles: GPXFile[] = [];

  for (let i = 0; i < list.length; i++) {
    const file = await loadFile(list[i]);
    if (file) {
      // Convertir a GeoJSON
      try {
        const geojson = parseGpxToGeoJSON(file.content);
        file.geojson = geojson;
      } catch (error) {
        console.warn(`Error al convertir GPX a GeoJSON para ${file.name}`, error);
        file.geojson = null;
      }
      loadedFiles.push(file);
    }
  }

  // Añade al store la nueva lista
  gpxFiles.update(current => [...current, ...loadedFiles]);

  // Selecciona el primer archivo cargado
  if (loadedFiles.length > 0) {
    selectedGpxFile.set(loadedFiles[0]);
  }
}

// Utilidad para cargar un archivo individual
async function loadFile(file: File): Promise<GPXFile | null> {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = () => {
      const data = reader.result?.toString() ?? null;
      if (data) {
        resolve({
          id: crypto.randomUUID ? crypto.randomUUID() : file.name + Date.now(),
          name: file.name,
          content: data
        });
      } else {
        resolve(null);
      }
    };

    reader.readAsText(file);
  });
}

// Función para exportar un archivo GPX a un archivo descargable
export function exportFile(file: GPXFile) {
  const blob = new Blob([file.content], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = file.name.endsWith('.gpx') ? file.name : `${file.name}.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Función para exportar todos los archivos GPX
export function exportAllFiles() {
  get(gpxFiles).forEach(file => exportFile(file));
}

// Función para cerrar un archivo GPX específico
export function closeFile(id: string) {
  gpxFiles.update(
      files => {
        const filtered = files.filter(f => f.id !== id);
        const current = get(selectedGpxFile);
        if (filtered.length === 0) {
          selectedGpxFile.set(null);
        } else if (current && current.id === id) {
          selectedGpxFile.set(filtered[0]);
        }
        return filtered;
      });
}

// Función para limpiar todos los archivos GPX del store
export function cleanFiles() {
  gpxFiles.set([]);
  selectedGpxFile.set(null);
}