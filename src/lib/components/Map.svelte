<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import type { FeatureCollection } from 'geojson';

    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
    import { PUBLIC_DEBUG } from '$env/static/public';
    import { gpxFiles, selectedGpxFile, addPointToSelectedTrack } from '$lib/gpxStore';
    import { appState } from '$lib/appStateStore';
    import { getTrackPoints, setTrackPoints, parseGeoJSONToGpx } from '$lib/gpx';
	
    export let accessToken = PUBLIC_MAPBOX_TOKEN;
    //export let geojsonData: GeoJSON.FeatureCollection | null = null;
    $: geojsonData = $selectedGpxFile?.geojson ?? null;
    
    const { Map } = mapboxgl;

    let map: mapboxgl.Map;;
    let mapContainer: HTMLDivElement;
    let dragPointIndex: number | null = null;

    let lng, lat, zoom, bearing, pitch, globalAppState;


    let points: [number, number][] = [];

    lng =  -3.7172;
    lat = 40.3880;
    zoom = 9;
    bearing = 0;
    pitch = 0;
    globalAppState = null;

    let initialState = { lng, lat, zoom, bearing, pitch, globalAppState };
  
    function updateData() {
        zoom = map.getZoom();
        lng = map.getCenter().lng;
        lat = map.getCenter().lat;
        bearing = map.getBearing();
        pitch = map.getPitch();
    }

    onMount(() => {
        map = new Map({
            container: mapContainer,
            accessToken: accessToken,
            center: [initialState.lng, initialState.lat],
            zoom: initialState.zoom,
            bearing: initialState.bearing,
            pitch: initialState.pitch,
            style: 'mapbox://styles/mapbox/streets-v9'
        });
    
        map.addControl(new mapboxgl.AttributionControl({
            compact: true,
        }));

        map.addControl(new mapboxgl.NavigationControl({
            visualizePitch: true,
        }));
    
        enablePointDragging();

        // Pintar inicial
        updateLayers();

        map.on('styledata', () => updateLayers());

        map.on('load', () => updateLayers());
        
        // Se añade un punto al final del track al hacer click en el mapa
        map.on('click', e => {
            if ($appState === 'EDIT') {
                addPointToSelectedTrack(e.lngLat.lng, e.lngLat.lat);
                
            }
        });

        $appState = initialState.globalAppState;
    });


    onDestroy(() => {
        map?.remove();
    });

    $: if (map) {
        map.getCanvas().style.cursor = $appState === "EDIT" ? "crosshair" : "";

        updateMapSources($selectedGpxFile?.geojson?.features ? $selectedGpxFile.geojson : { type: 'FeatureCollection', features: [] });
        updateLayers();
        
    }

    $: if (map && !geojsonData) {
        updateLayers();
    }

    function handleReset() {
        map.flyTo({
        center: [initialState.lng, initialState.lat],
        zoom: initialState.zoom,
        bearing: 0,
        pitch: 0,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion

        
        });
    }
    
    // Crear GeoJSON de puntos con índice en properties
    function createPointsGeoJSON(geojson: FeatureCollection): FeatureCollection {
        const coords = getTrackPoints(geojson);
        return {
            type: 'FeatureCollection',
            features: coords.map((coord, idx) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: coord },
                properties: { index: idx }
        }))
        };
    }

    // Función que actualiza las fuentes directamente
function updateMapSources(updatedGeojson: FeatureCollection) {
  if (!map) return;

  const pointsGeojson = createPointsGeoJSON(updatedGeojson);

  if (map.getSource('gpx-points')) {
    (map.getSource('gpx-points') as mapboxgl.GeoJSONSource).setData(pointsGeojson);
  }

  if (map.getSource('gpx')) {
    (map.getSource('gpx') as mapboxgl.GeoJSONSource).setData(updatedGeojson);
  }
}

    function updateLayers() {

        if (!map) return;
        if (!geojsonData) {
            // limpiar si no hay datos
            if (map.getLayer('gpx-points-layer')) map.removeLayer('gpx-points-layer');
            if (map.getSource('gpx-points')) map.removeSource('gpx-points');
            if (map.getLayer('gpx-line')) map.removeLayer('gpx-line');
            if (map.getSource('gpx')) map.removeSource('gpx');
            return;
        }

        const coords = getTrackPoints(geojsonData);

        // --- CAPA PUNTOS ---
        const pointsGeojson = createPointsGeoJSON(geojsonData);
        if (map.getSource('gpx-points')) {
            (map.getSource('gpx-points') as mapboxgl.GeoJSONSource).setData(pointsGeojson);
            map.setLayoutProperty('gpx-points-layer', 'visibility', $appState === 'EDIT' ? 'visible' : 'none');
        } else {
            map.addSource('gpx-points', { type: 'geojson', data: pointsGeojson });
            map.addLayer({
                id: 'gpx-points-layer',
                type: 'symbol',
                source: 'gpx-points',
                layout: {
                    'icon-image': 'marker-15',
                    'icon-size': 2,
                    'icon-allow-overlap': true,
                    'visibility': $appState === 'EDIT' ? 'visible' : 'none'
                }
            });
        }

        // --- CAPA LÍNEA ---
        if (coords.length >= 2) {
            if (map.getSource('gpx')) {
                (map.getSource('gpx') as mapboxgl.GeoJSONSource).setData(geojsonData);
            } else {
                map.addSource('gpx', { type: 'geojson', data: geojsonData });
                map.addLayer({
                    id: 'gpx-line',
                    type: 'line',
                    source: 'gpx',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#f00', 'line-width': 3 }
                });
            }
        } else {
            // si hay menos de 2 puntos, eliminar la línea si ya existe
            if (map.getLayer('gpx-line')) map.removeLayer('gpx-line');
            if (map.getSource('gpx')) map.removeSource('gpx');
        }
    }

    function enablePointDragging() {
        if (!map) return;

        map.on('mouseenter', 'gpx-points-layer', () => {
            if ($appState === 'EDIT') {
                map.getCanvas().style.cursor = 'pointer';
            }
        });
        map.on('mouseleave', 'gpx-points-layer', () => {
            map.getCanvas().style.cursor = $appState === 'EDIT' ? 'crosshair' : '';
        });

        map.on('mouseenter', 'gpx-line', () => {
            if ($appState === 'EDIT') {
                map.getCanvas().style.cursor = 'pointer';
            }
        });
        map.on('mouseleave', 'gpx-line', () => {
            map.getCanvas().style.cursor = $appState === 'EDIT' ? 'crosshair' : '';
        });

        map.on('mousedown', 'gpx-points-layer', e => {
            if ($appState !== 'EDIT') return; // solo en modo edición
            if (!e.features?.length) return;

            dragPointIndex = e.features[0].properties?.index;
            if (dragPointIndex === null || dragPointIndex === undefined) return;

            // Cambiar cursor y deshabilitar pan
            map.getCanvas().style.cursor = 'grabbing';
            map.dragPan.disable();
            map.boxZoom.disable();

            map.on('mousemove', onDrag);
            map.once('mouseup', onDrop);
        });

        function onDrag(e) {

            if (dragPointIndex == null) return;
        
            const file = $selectedGpxFile;
            
            if (!file?.geojson) return;

            const coords = getTrackPoints(file.geojson);
            coords[dragPointIndex] = [e.lngLat.lng, e.lngLat.lat];

            const newGeojson = setTrackPoints(file.geojson, coords);

            // Convertir a contenido GPX actualizado
            const newContent = parseGeoJSONToGpx(newGeojson);

            const updatedFile = {
                ...file,
                geojson: newGeojson,
                content: newContent
            };

            selectedGpxFile.set(updatedFile);

            gpxFiles.update(files => 
                files.map(f => f.id === updatedFile.id ? updatedFile : f)
            );
            
            updateMapSources(newGeojson);

            // El cursor sigue en grabbing mientras se mueve
            map.getCanvas().style.cursor = 'grabbing';
        }
        

        function onDrop() {
            dragPointIndex = null;
            map.getCanvas().style.cursor = $appState === 'EDIT' ? 'crosshair' : '';
            map.dragPan.enable();
            map.boxZoom.enable();
            map.off('mousemove', onDrag);

        }
    }



    

</script>

<div class="map" bind:this={mapContainer}>
     {#if PUBLIC_DEBUG.toUpperCase() === 'TRUE'}
        <div class="map-debug">
            Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {zoom.toFixed(2)} | Bearing: {bearing.toFixed(1)}° | Pitch: {pitch.toFixed(1)}°
        </div>
    {/if}
    <!--<button on:click={handleReset} class="reset-button">Reset</button>-->
</div>

<style>
  /* Tus estilos */
  .map {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .map-debug {
    position: absolute;
    bottom: 0;
    left: 0;
    margin: 12px;
    background-color: rgb(35 55 75 / 90%);
    color: #fff;
    padding: 6px 12px;
    font-family: monospace;
    z-index: 10;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .reset-button {
    position: absolute;
    top: 50px;
    z-index: 1;
    left: 12px;
    padding: 4px 10px;
    border-radius: 10px;
    cursor: pointer;
  }
</style>