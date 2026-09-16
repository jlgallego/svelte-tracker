import type { AnchorPoint } from './types';  // Ajusta si tienes tipos declarados

// Helper para calcular ángulo en radianes entre tres puntos
function getAngle(p1: [number, number], p2: [number, number], p3: [number, number]): number {
  const v1 = [p1[0] - p2[0], p1[1] - p2[1]];
  const v2 = [p3[0] - p2[0], p3[1] - p2[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const mag1 = Math.hypot(...v1);
  const mag2 = Math.hypot(...v2);
  // Clamp para evitar errores numéricos
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosAngle); // en radianes
}

export function generateSmartAnchorPoints(trackCoords: [number, number][]): AnchorPoint[] {
  const anchorPoints: AnchorPoint[] = [];
  const angleThreshold = Math.PI / 4; // 45 grados, ajustable

  if (!trackCoords || trackCoords.length < 2) return [];

  anchorPoints.push({ id: `anchor-0`, lngLat: trackCoords[0] });

  for (let i = 1; i < trackCoords.length - 1; i++) {
    const prev = trackCoords[i - 1];
    const curr = trackCoords[i];
    const next = trackCoords[i + 1];
    const angle = getAngle(prev, curr, next);

    if (angle < angleThreshold) {
      anchorPoints.push({ id: `anchor-${i}`, lngLat: curr });
    }
  }

  anchorPoints.push({
    id: `anchor-${trackCoords.length - 1}`,
    lngLat: trackCoords[trackCoords.length - 1],
  });

  return anchorPoints;
}