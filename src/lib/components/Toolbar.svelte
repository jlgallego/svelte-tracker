<script lang="ts">

    import { Toolbar } from "bits-ui";
    import { Popover } from "bits-ui";
    import { appState, toggleEdit, routingEnabled, avoidCycling, selectedProfile } from '$lib/appStateStore'; // Importa el store de estado de la aplicación

    import { 
        Dot,
        PencilSimpleLine,
        FileX,
        FloppyDisk
     } from "phosphor-svelte";


    const profiles = [
        { value: 'trekking', label: 'Trekking' },
        { value: 'bike', label: 'Bicicleta' },
        { value: 'car', label: 'Coche' }
    ];

    let profileValue = $selectedProfile;

    function onProfileChange(event) {
        selectedProfile.set(event.target.value);
        profileValue = event.target.value;
    }

</script>




        <Toolbar.Root class="flex flex-row h-12 absolute top-20 z-10 items-center rounded-10px border border-border bg-slate-500  px-2 py-4 shadow-mini">

            <Toolbar.Button 
                aria-label= "Editar" 
                pressed={$appState === "EDIT"}
                aria-pressed={$appState === "EDIT" ? "true" : "false"}
                onclick={() => { toggleEdit(); }}
                class="px-3 py-1 border rounded"
                >
                <PencilSimpleLine size="20" />
                {$appState === "EDIT" ? "Dejar de editar" : "Editar"}
            </Toolbar.Button>

            {#if $appState === "EDIT"}
                <!-- Toggle enrutado automático -->
                <label class="ml-4 flex items-center space-x-2 cursor-pointer select-none">
                    <input type="checkbox" bind:checked={$routingEnabled} class="form-checkbox" />
                    <span>Enrutado automático</span>
                </label>

                <!-- Selector de perfiles -->
                <select bind:value={$selectedProfile} on:change={onProfileChange} class="ml-2 rounded border px-2 py-1 bg-white text-black">
                    {#each profiles as profile}
                        <option value={profile.value}>{profile.label}</option>
                    {/each}
                </select>

                <!-- Toggle evitar vías ciclistas -->
                <label class="ml-4 flex items-center space-x-2 cursor-pointer select-none">
                    <input type="checkbox" bind:checked={$avoidCycling} class="form-checkbox" />
                    <span>Evitar vías ciclistas</span>
                </label>
            {/if}


        </Toolbar.Root>

