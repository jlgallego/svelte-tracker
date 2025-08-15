<script lang="ts">

    import { Toolbar } from "bits-ui";
    import { Popover } from "bits-ui";
    import { appState, toggleEdit } from '$lib/appStateStore'; // Importa el store de estado de la aplicación

    import { 
        Dot,
        PencilSimpleLine,
        FileX,
        FloppyDisk
     } from "phosphor-svelte";


</script>




        <Toolbar.Root class="flex flex-row h-12 absolute top-20 z-10 items-center rounded-10px border border-border bg-slate-500  px-2 py-4 shadow-mini">

            <Toolbar.Button 
                aria-label= "Editar" 
                pressed={$appState === "EDIT" }
                aria-pressed={$appState === "EDIT" ? "true" : "false"}
                onclick={() => { toggleEdit(); }}
                class="px-3 py-1 border rounded"
                >
                <PencilSimpleLine size="20" />
                {$appState === "EDIT" ? "Dejar de editar" : "Editar"}
            </Toolbar.Button>
                        <Toolbar.Button aria-label= "Editar">
                <PencilSimpleLine size="20" />
                <span>Editar</span>
            </Toolbar.Button>

        </Toolbar.Root>

