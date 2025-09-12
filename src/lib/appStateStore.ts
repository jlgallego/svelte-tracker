import { writable, type Writable, get } from 'svelte/store';

// Store para el estado de la aplicación
export const appState: Writable<"EDIT" | null> = writable(null);

// Stores para opciones de edición
export const routingEnabled = writable(true);
export const selectedProfile = writable('trekking');
export const avoidCycling = writable(false);

export function toggleEdit() {
    const current = get(appState);
    appState.set(current === null ? "EDIT" : null);
}

