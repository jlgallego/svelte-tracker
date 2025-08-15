<script lang="ts">
    import { appState } from "$lib/appStateStore";
	import { Menubar } from "bits-ui";
    
    import { 
        LineSegments,
        FilePlus,
        FolderOpen,
        FileX,
        FloppyDisk
     } from "phosphor-svelte";
    
    import { 
        gpxFiles, 
        selectedGpxFile, 
        newFile, 
        triggerFileInput, 
        loadFiles,
        exportFile, 
        exportAllFiles,
        closeFile,
        cleanFiles
    } from '$lib/gpxStore';

</script>

<div class="absolute top-3 left-0 right-0 z-20 flex flex-row justify-left">
    <div class="w-fit flex flex-row p-1 bg-background rounded-r-md shadow-md items-center bg-slate-700/90 gap-1">
        <LineSegments class="flex text-[#f74800] bg-background-alt m-2" size={30} weight="bold" />
        <Menubar.Root class="flex h-12 items-center gap-1  bg-background-alt px-[3px] shadow-mini">
            <Menubar.Menu>
                <Menubar.Trigger 
                    disabled={$appState === "EDIT"}
                    aria-label="Archivo" 
                    class="flex h-10 items-center rounded-[6px] px-3 text-sm font-medium outline-none transition-colors bg-white hover:bg-gray-200 focus:bg-gray-100 ${ $appState === 'EDIT' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700' }"
                    >
                    Archivo
                </Menubar.Trigger>
                <Menubar.Content class="bg-white shadow-lg rounded-md border min-w-[220px] cursor-pointer transition-colors text-gray-700 z-50">
                    <Menubar.Item class="flex items-center gap-2 pt-1 pb-1" onSelect={() => { newFile(); }}>
                        <FilePlus class="mr-2" height="1.5em" width="1.5em" />
                        Nuevo GPX
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item class="flex items-center gap-2 pt-1 pb-1" onSelect={() => { triggerFileInput(); }}>
                        <FolderOpen class="mr-2" height="1.5em" width="1.5em" />
                        Abrir GPX
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item class="flex items-center gap-2 pt-1 pb-1" onSelect={() => { closeFile($selectedGpxFile.id) }}>
                        <FileX class="mr-2" height="1.5em" width="1.5em" />
                        Cerrar archivo
                    </Menubar.Item>
                    <Menubar.Item class="flex items-center gap-2 pt-1 pb-1" onSelect={() => { cleanFiles() }}>
                        <FileX class="mr-2" height="1.5em" width="1.5em" />
                        Cerrar todos los archivos
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item class="flex items-center gap-2 pt-1 pb-1" onSelect={() => { exportFile($selectedGpxFile) }}>
                        <FloppyDisk class="mr-2" height="1.5em" width="1.5em" />
                        Guardar GPX
                    </Menubar.Item>
                    <Menubar.Item class="flex items-center gap-2 pt-1 pb-1" onSelect={() => { exportAllFiles() }}>
                        <FloppyDisk class="mr-2" height="1.5em" width="1.5em" />
                        Guardar todos los GPX
                    </Menubar.Item>                    
                    
                </Menubar.Content>
            </Menubar.Menu>
        </Menubar.Root>
    </div>
</div>

<svelte:window
    on:drop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            loadFiles(e.dataTransfer.files);
        }
    }}
    on:dragover={e => e.preventDefault()}
/>

<style lang="postcss">
    div :global(button) {

        @apply px-3;
        @apply py-0.5;
    }
</style>