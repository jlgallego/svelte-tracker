import { writable, type Writable, get } from 'svelte/store';

// Store para el estado de la aplicación
export const appState: Writable<"EDIT" | null> = writable(null);

export function toggleEdit() {
    const current = get(appState);
    appState.set(current === null ? "EDIT" : null);
}

