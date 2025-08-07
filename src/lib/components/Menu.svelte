<script lang="ts">
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



<div class="absolute md:top-2 left-0 right-0 z-20 flex flex-row justify-left">
    <div class="w-fit flex flex-row p-1 bg-background rounded-r-md shadow-md">
        <LineSegments class="flex text-foreground bg-background-alt items-center" size={24} weight="bold" />
        <Menubar.Root class="flex h-12 items-center gap-1  bg-background-alt px-[3px] shadow-mini">
            <Menubar.Menu>
                <Menubar.Trigger aria-label= "Archivo" class="flex h-10 items-center rounded-[6px] px-3 text-sm font-medium outline-none transition-colors bg-white text-gray-700 hover:bg-gray-200 focus:bg-gray-100">
                    Archivo
                </Menubar.Trigger>
                <Menubar.Content class="bg-white shadow-lg rounded-md border min-w-[220px] cursor-pointer">
                    <Menubar.Item class="flex items-center gap-2" onSelect={() => { newFile(); }}>
                        <FilePlus class="mr-2" />
                        Nuevo GPX
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item class="flex items-center gap-2" onSelect={() => { triggerFileInput(); }}>
                        <FolderOpen class="mr-2" />
                        Abrir GPX
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item class="flex items-center gap-2" onSelect={() => { closeFile($selectedGpxFile.id) }}>
                        <FileX class="mr-2" />
                        Cerrar archivo
                    </Menubar.Item>
                    <Menubar.Item class="flex items-center gap-2" onSelect={() => { cleanFiles() }}>
                        <FileX class="mr-2" />
                        Cerrar todos los archivos
                    </Menubar.Item>
                    <Menubar.Separator />
                    <Menubar.Item class="flex items-center gap-2" onSelect={() => { exportFile($selectedGpxFile) }}>
                        <FloppyDisk class="mr-2" />
                        Guardar GPX
                    </Menubar.Item>
                    <Menubar.Item class="flex items-center gap-2" onSelect={() => { exportAllFiles() }}>
                        <FloppyDisk class="mr-2" />
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