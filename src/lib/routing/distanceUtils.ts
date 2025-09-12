export function getClosestPointOnSegments(
  p: [number, number],
  segments: [number, number][]
): { index: number, projection: [number, number], sqDist: number } {
  let minDistSq = Infinity;
  let segmentIndex = -1;
  let closestProj: [number, number] = [0, 0];
  for (let i = 0; i < segments.length - 1; i++) {
    const v = segments[i];
    const w = segments[i + 1];
    const l2 = (w[0] - v[0]) ** 2 + (w[1] - v[1]) ** 2;
    let t = 0;
    if (l2 !== 0) {
      t =
        ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
      t = Math.max(0, Math.min(1, t));
    }
    const projX = v[0] + t * (w[0] - v[0]);
    const projY = v[1] + t * (w[1] - v[1]);
    const distSq = (p[0] - projX) ** 2 + (p[1] - projY) ** 2;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      segmentIndex = i;
      closestProj = [projX, projY];
    }
  }
  return { index: segmentIndex, projection: closestProj, sqDist: minDistSq };
}