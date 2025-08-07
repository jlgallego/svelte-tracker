<script lang="ts">

    import Map from '$lib/components/Map.svelte';
    import Menu from '$lib/components/Menu.svelte';
	import Testmenu from '$lib/components/Testmenu.svelte';
    import { gpxFiles, selectedGpxFile, triggerFileInput } from '$lib/gpxStore'; // gpxFiles y selectedGpxFile son variables reactivas
   
    function selectFile(file: GPXFile) {
        selectedGpxFile.set(file);
    }

    let bottomPanelHeight = 200;
    // ... manejo resize-handle ...
    function onPointerDown(event) {
        const startY = event.clientY;
        const startHeight = bottomPanelHeight;

        function onPointerMove(moveEvent) {
            const newHeight = startHeight + (startY - moveEvent.clientY);
            bottomPanelHeight = Math.max(100, newHeight); // mínimo 100px
        }

        function onPointerUp() {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

//    console.log(gpxFiles);
</script>


<!-- <div class="button-bar"> -->
<!--    <button on:click={triggerFileInput} class="open-button">Abrir archivos GPX</button> -->
<!-- </div> -->
<Menu  class="absolute top-2 left-2 z-50" /> <!-- Componente de menú que maneja la carga de archivos GPX -->
<!-- <Testmenu /> <!-- Componente de menú de prueba -->
    
<!-- ZONA MAPA FLEXIBLE -->
 
<div class="map-section">
    <Map geojsonData={$selectedGpxFile?.geojson} />
</div>

<section class="bottom-panel" style="height: {bottomPanelHeight}px;">
    <div class="resize-handle" on:pointerdown={onPointerDown} aria-label="Drag para cambiar tamaño" role="slider" tabindex="0"></div>
    <h3>Ficheros cargados</h3>
    {#if $gpxFiles && $gpxFiles.length > 0}

    <ul class="file-list">
        {#each $gpxFiles as file}
        <li>
            <button on:click={() => selectFile(file)}
            class:selected={$selectedGpxFile?.id === file.id}>
            {file.name}
            </button>
        </li>
        {/each}
    </ul>

    <div class="selected-info">
        <h2>GPX seleccionado</h2>
        <pre>{JSON.stringify($selectedGpxFile?.name, null, 2)}</pre>
    </div>
    {/if}
</section>



<style>
/*   .open-button {
    margin: 5px;
    top: 90px;
    left: 12px;
    z-index: 10;
  } */

  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
    top: 130px; /* ligeramente debajo del botón */
    left: 12px;
    max-height: 300px;  /* para scroll */
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.9);
    z-index: 10;
    width: 220px;
    border-radius: 6px;
    box-shadow: 0 0 8px rgba(0,0,0,0.15);
  }

  .file-list li button {
    width: 100%;
    background: transparent;
    border: none;
    padding: 8px 12px;
    text-align: left;
    cursor: pointer;
  }

  .file-list li button.selected {
    font-weight: bold;
    color: blue;
    background-color: #e0f0ff;
  }

  .selected-info {
    top: 440px;
    left: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 12px;
    border-radius: 6px;
    max-width: 220px;
    z-index: 10;
    box-shadow: 0 0 8px rgba(0,0,0,0.15);
  }
</style>