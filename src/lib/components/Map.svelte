<script lang="ts">
    import {RoutingManager} from '$lib/routing/RoutingManager';
    import { onMount, onDestroy } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import type { FeatureCollection } from 'geojson';

    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
    import { PUBLIC_DEBUG } from '$env/static/public';
    import { gpxFiles, 
        selectedGpxFile, 
        movePointInSelectedTrack, 
        removePointFromSelectedTrack } from '$lib/gpxStore';
    import { appState } from '$lib/appStateStore';
    
	
    export let accessToken = PUBLIC_MAPBOX_TOKEN;
    //export let geojsonData: GeoJSON.FeatureCollection | null = null;
    $: geojsonData = $selectedGpxFile?.geojson ?? null;
    
    const { Map } = mapboxgl;

    let map: mapboxgl.Map;;
    let routingManager: RoutingManager;

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

        // Se instancia la clase que controla la edición y el routing
        routingManager = new RoutingManager(map, selectedGpxFile);
    
        map.addControl(new mapboxgl.AttributionControl({
            compact: true,
        }));

        map.addControl(new mapboxgl.NavigationControl({
            visualizePitch: true,
        }));
    
        // Al hacer click en el track, se añade un punto intermedio
        map.on('click', 'route-line', (e) => {
            console.log("Event: click on route-line");
            if ($appState === 'EDIT') {
                const coords = e.lngLat;
                routingManager.addAnchorOnTrack(coords.lng, coords.lat);
            }
        });

        // Se añade un punto al final del track al hacer click en el mapa
        map.on('click', e => {
            if ($appState === 'EDIT') {
                // Evitar manejar el evento si ya se manejó en la capa 'route-line'
                const features = map.queryRenderedFeatures(e.point, { layers: ['route-line'] });
                if (features.length === 0) {
                    const coords = e.lngLat;
                    console.log("Event: click NOT on route-line");
                    routingManager.addAnchor(coords.lng, coords.lat);
                }
            }
        });

    });


    onDestroy(() => {
        routingManager?.dispose();
        map?.remove();
    });

    $: if (map) {
        map.getCanvas().style.cursor = $appState === "EDIT" ? "crosshair" : "";
    }

    $: if (routingManager && map) {
        routingManager.setEditVisuals($appState === 'EDIT');
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