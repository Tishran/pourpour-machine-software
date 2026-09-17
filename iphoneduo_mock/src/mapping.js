export const PREVIEW_END = 3.8;
export const OPEN_THRESHOLD = 8;
// Zoom the recording in slightly so its content (status bar / nav bar) sits closer
// to the screen edges instead of leaving its own margin short of the bezel.
export const VIDEO_ZOOM = 1.1;
export function coverUV(u, v, sourceAspect, screenAspect) {
  const sx = Math.min(1, screenAspect / sourceAspect) / VIDEO_ZOOM;
  const sy = Math.min(1, sourceAspect / screenAspect) / VIDEO_ZOOM;
  return [0.5 + (u - 0.5) * sx, 0.5 + (v - 0.5) * sy];
}
// Arc-length preserving bend. Both rigid leaves meet the flexible strip tangentially.
export function bendPoint(x, theta, halfBend = 0.045) {
  if (theta < 0.00001 || x >= halfBend) return [x, 0];
  const radius = 2 * halfBend / theta;
  const t = Math.min(theta, (halfBend - x) / (2 * halfBend) * theta);
  const endX = halfBend - radius * Math.sin(t);
  const endZ = radius * (1 - Math.cos(t));
  const remaining = Math.min(0, x + halfBend);
  return [endX + remaining * Math.cos(theta), endZ - remaining * Math.sin(theta)];
}
