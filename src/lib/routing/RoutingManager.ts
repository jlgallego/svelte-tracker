import mapboxgl from 'mapbox-gl';
import { selectedGpxFile, gpxFiles } from '$lib/gpxStore';
import type { GPXFile } from '$lib/gpx';
import { get } from 'svelte/store';
import { getTrackPoints, setTrackPoints, parseGeoJSONToGpx } from '$lib/gpx';
import { createRoutingUrl } from '$lib/gpx/routing';
import { writable, type Readable } from 'svelte/store';
import simplify from 'simplify-js';
import { appState, routingEnabled, avoidCycling, selectedProfile } from '$lib/appStateStore';
import { getClosestPointOnSegments } from './distanceUtils';



export class RoutingManager {
  private map: mapboxgl.Map;
  private fileStore: selectedGpxFile;
  private currentFile: GPXFile | null = null;
  

  // Reactivity: expose current GPX file store & expose updates
  public fileUnsubscribe: () => void;

  constructor(map: mapboxgl.Map, fileStore: selectedGpxFile) {
    this.map = map;
    this.fileStore = fileStore;
    this.fileUnsubscribe = this.fileStore.subscribe(file => {
      this.removeAllAnchorMarkers();
      this.currentFile = file;
      if (!file) {
        if (this.map.getLayer('route-line')) this.map.removeLayer('route-line');
        if (this.map.getSource('route-line')) this.map.removeSource('route-line');
      } else {
        this.renderAnchors();
        this.renderRouteLine();
      }
    });
    
    this.map.on('zoom', () => {
      const isEditing = get(appState) === 'EDIT';
      this.toggleAnchorsForZoomLevel(isEditing);
    });
  }

  private removeAllAnchorMarkers() {
    if (!this.currentFile?.anchorPoints) return;
    
    this.currentFile.anchorPoints.forEach(anchor => {
      if (anchor.marker) {
        anchor.marker.remove();
        delete anchor.marker;
      }
    });
  }


  private createMarkerElement(
    size = 16,
    bgColor = '#0074D9',
    borderColor = '#fff',
    borderWidth = 2
  ): HTMLElement {
    const el = document.createElement('div');
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = bgColor;
    el.style.border = `${borderWidth}px solid ${borderColor}`;
    el.style.borderRadius = '50%';
    el.style.boxSizing = 'border-box';
    el.style.cursor = 'pointer';
    return el;
  }

  // Renderiza los puntos como marcadores Mapbox
  private renderAnchors() {
    const isEditing = get(appState) === 'EDIT';

    // Primero elimina todos los marcadores actuales para evitar duplicados
    this.removeAllAnchorMarkers();

    if (!this.currentFile?.anchorPoints) return;

    this.currentFile.anchorPoints.forEach((anchor, index) => {
      // Se crea un marcador nuevo para cada anchorPoint
      const markerElement = this.createMarkerElement(16, '#0074D9', '#fff', 2);

      const marker = new mapboxgl.Marker({ element: markerElement, draggable: true })
        .setLngLat(anchor.lngLat)
        .addTo(this.map);

      marker.on('dragend', () => this.handleDragEnd(index, marker.getLngLat()));
      
      // Asignar marker al anchor para manejo futuro (drag, eliminar)
      anchor.marker = marker; 
    });

    this.toggleAnchorsForZoomLevel(isEditing);
    
  }

  // Renderiza la línea del track (GPX)
  private renderRouteLine() {
    if (!this.currentFile?.geojson) return;

    const isEditing = get(appState) === 'EDIT';
    const lineWidth = isEditing ? 7 : 3;

    if (this.map.getSource('route-line')) {
      (this.map.getSource('route-line') as mapboxgl.GeoJSONSource).setData(this.currentFile.geojson);
      this.map.setPaintProperty('route-line', 'line-width', lineWidth); // actualizar grosor al actualizar data
    } else {
      this.map.addSource('route-line', { type: 'geojson', data: this.currentFile.geojson });
      this.map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#f00', 'line-width': lineWidth }
      });
    }
    console.log(this.currentFile.anchorPoints)
  }

  // Maneja el fin del drag en un punto
  private async handleDragEnd(index: number, lngLat: mapboxgl.LngLat) {
    if (!this.currentFile) return;

    // Actualizar la posición del anchor point en el array
    const anchors = [...this.currentFile.anchorPoints];
    const oldMarker = anchors[index].marker;

    // Actualiza la posición del anchor y mantiene el mismo marker
    anchors[index] = {
      ...anchors[index],
      lngLat: [lngLat.lng, lngLat.lat],
      marker: oldMarker
    };

    // Mueve el marker físico en el mapa a la nueva posición
    oldMarker.setLngLat(lngLat);

    this.removeAllAnchorMarkers();

    await this.updateRouteFromAnchors(anchors); 
    

  }


  // Añade un anchorPoint
  public async addAnchor(lng: number, lat: number) {
    if (!this.currentFile) return;

    const anchors = this.currentFile.anchorPoints ? [...this.currentFile.anchorPoints] : [];
    anchors.push({
      id: `anchor-${anchors.length}`,
      lngLat: [lng, lat]
    });

    await this.updateRouteFromAnchors(anchors);
  }

  // Añade un anchorPoint entre otros dos (al hacer click en el track)
  public async addAnchorOnTrack(lng: number, lat: number) {
    if (!this.currentFile || !this.currentFile.geojson) return;

    const clickPoint: [number, number] = [lng, lat];
    const lineFeature = this.currentFile.geojson.features.find(f => f.geometry.type === 'LineString');
    if (!lineFeature) return;

    const coords = lineFeature.geometry.coordinates as [number, number][];

    const { index: segIdx, projection: closestProj, sqDist } = getClosestPointOnSegments(clickPoint, coords);

    // Umbral razonable (0.0005^2 ≈ 2.5e-7)
    const maxDistSq = 2.5e-7;
    if (sqDist > maxDistSq) {
      console.log('Click demasiado lejos del track.');
      return;
    }

    // Localiza el anchor original más cercano al punto de inicio de ese microsegmento,
    // para saber en qué subtramo insertar el nuevo anchor
    let anchorInsertIndex = 0;
    let anchorMinDist = Infinity;
    for (let i = 0; i < this.currentFile.anchorPoints.length; i++) {
      const a = this.currentFile.anchorPoints[i].lngLat;
      const d = (a[0] - coords[segIdx][0]) ** 2 + (a[1] - coords[segIdx][1]) ** 2;
      if (d < anchorMinDist) {
        anchorMinDist = d;
        anchorInsertIndex = i;
      }
    }

    const newAnchors = [...this.currentFile.anchorPoints];
    newAnchors.splice(anchorInsertIndex + 1, 0, {
      id: `anchor-${Date.now()}`,
      lngLat: closestProj
    });

    await this.updateRouteFromAnchors(newAnchors);
  }

  private async updateRouteFromAnchors(anchors: AnchorPoint[]) {
    if (!this.currentFile) return;

    // Actualizar anchors en GPXFile
    let updatedFile = { ...this.currentFile, anchorPoints: anchors };

    if (get(routingEnabled) && anchors.length > 1) {
      const points = anchors.map(a => [a.lngLat[0], a.lngLat[1], 0] as [number, number, number]);
      const routeGeojson = await this.fetchRouteFromBRouter(points);

      if (routeGeojson) {
        updatedFile = { ...updatedFile, geojson: routeGeojson };
      }
    } else {
      // Sin routing, línea directa entre anchors
      const coords = anchors.map(a => [a.lngLat[0], a.lngLat[1], 0] as [number, number, number]);
      const geojson = setTrackPoints(this.currentFile.geojson || { type: 'FeatureCollection', features: [] }, coords);
      updatedFile = { ...updatedFile, geojson };
    }

    updatedFile.content = parseGeoJSONToGpx(updatedFile.geojson);

    this.currentFile = updatedFile;
    selectedGpxFile.set(updatedFile);
    gpxFiles.update(files => files.map(f => f.id === updatedFile.id ? updatedFile : f));

    this.renderRouteLine();
    this.renderAnchors();
  }

  private toggleAnchorsForZoomLevel(isEditing: boolean) {
    const zoom = this.map.getZoom();
    if (!this.currentFile?.anchorPoints) return;

    this.currentFile.anchorPoints.forEach((anchor, i) => {
      if (anchor.marker) {
        if (isEditing) {
          anchor.marker.getElement().style.display = '';
        } else {
          anchor.marker.getElement().style.display = 'none';
        }

      }
    });
  }

  public setEditVisuals(isEditing: boolean) {
    if (this.map.getLayer('route-line')) {
      // Ajustar grosor de la línea
      this.map.setPaintProperty('route-line', 'line-width', isEditing ? 7 : 3);
    }
    
    this.toggleAnchorsForZoomLevel(isEditing);
  }

  private async fetchRouteFromBRouter(points: [number, number, number][]): Promise<GeoJSON.FeatureCollection | null> {
      if (points.length < 2) return null;

      const url = createRoutingUrl(points);
      if (!url) return null;

      try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);

          const geojson = await response.json();
          return geojson;
      } catch (error) {
          console.error('Error fetching route from BRouter:', error);
          return null;
      }
  }

  // Limpiar suscripciones cuando ya no se necesite
  public dispose() {
      this.fileUnsubscribe();
      this.removeAllAnchorMarkers();
  }
}
