// src/lib/gpx/routing.ts

import { routingEnabled, selectedProfile, avoidCycling } from '$lib/appStateStore';
import { get } from 'svelte/store';

export function createRoutingUrl(points: [number, number][] | [number, number, number][]): string | null {
  if (!routingEnabled) return null;

  const profile = get(selectedProfile) || 'trekking';
  const avoid = get(avoidCycling);
  
  // Unir puntos con pipe '|'
  const lonlatsParam = points.map(coord => coord.slice(0, 2).join(',')).join('|');

  let url = `http://sdrpidb01:17777/brouter?lonlats=${lonlatsParam}&profile=${profile}&format=geojson`;

  if (avoid) {
    // Ejemplo: si tienes perfiles alternativos que evitan vías ciclistas, cambia profile
    url = `http://sdrpidb01:17777/brouter?lonlats=${lonlatsParam}&profile=${profile}_avoid_cycleways&format=geojson`;
  }

  return url;
}
