<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
    import { PUBLIC_DEBUG } from '$env/static/public';


    export let accessToken = PUBLIC_MAPBOX_TOKEN;

    const { Map } = mapboxgl;

    let map: mapboxgl.Map;;
    let mapContainer: HTMLDivElement;
    let lng, lat, zoom, bearing, pitch;

    lng =  -3.7172;
    lat = 40.3880;
    zoom = 9;
    bearing = 0;
    pitch = 0;

    let initialState = { lng, lat, zoom, bearing, pitch };

    
    export let geojsonData: GeoJSON.FeatureCollection | null = null;

    lng =  -3.7172;
    lat = 40.3880;
    zoom = 9;
    bearing = 0;
    pitch = 0;

    
    
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

        map.on('move', () => {
            updateData();
        });
        
        map.addControl(new mapboxgl.AttributionControl({
            compact: true,
        }));

        map.addControl(new mapboxgl.NavigationControl({
            visualizePitch: true,
        }));

        

    });


    onDestroy(() => {
        map?.remove();
    });


    function handleReset() {
        map.flyTo({
        center: [initialState.lng, initialState.lat],
        zoom: initialState.zoom,
        bearing: 0,
        pitch: 0,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion

        
        });
    }
    
    $: if (map) {
        if (geojsonData) {
            // Si la fuente existe, actualízala, si no, añádela
            if (map.getSource('gpx')) {
                (map.getSource('gpx') as mapboxgl.GeoJSONSource).setData(geojsonData);
            } else {
                map.addSource('gpx', {
                    type: 'geojson',
                    data: geojsonData
                });
                map.addLayer({
                    id: 'gpx-line',
                    type: 'line',
                    source: 'gpx',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#f00',
                        'line-width': 3
                    }
                });
            }
        
        } else {
            // Si no hay datos, elimina la fuente y la capa
            if (map.getSource('gpx')) {
                map.removeLayer('gpx-line');
                map.removeSource('gpx');
            }
        }
    }

</script>

<div class="map" bind:this={mapContainer}>
     {#if PUBLIC_DEBUG.toUpperCase() === 'TRUE'}
        <div class="map-debug">
            Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {zoom.toFixed(2)} | Bearing: {bearing.toFixed(1)}° | Pitch: {pitch.toFixed(1)}°
        </div>
    {/if}
    <button on:click={handleReset} class="reset-button">Reset</button>
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