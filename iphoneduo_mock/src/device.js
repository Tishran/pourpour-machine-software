// Hardware dimensions are independent of the uploaded recording.
// https://www.apple.com/iphone-duo/specs/
import { VIDEO_ZOOM } from './mapping.js';
export const DUO = Object.freeze({
  openWidth: 164.6, height: 117.8, leafDepth: 5.2,
  closedWidth: 84.1, closedDepth: 11.3,
  outerWidth: 1398 / 460 * 25.4, outerHeight: 2034 / 460 * 25.4,
  innerWidth: 2670 / 430 * 25.4, innerHeight: 1878 / 430 * 25.4,
});
export const UNIT = 1 / 25;
export function innerPortraitUV(u, v, sourceAspect) {
  // The whole enclosure turns clockwise into portrait; counter-orient its pixels.
  // VIDEO_ZOOM pulls the content nearer the top/bottom edges (see mapping.js).
  const aspect = DUO.innerHeight / DUO.innerWidth;
  const sx = Math.min(1, aspect / sourceAspect) / VIDEO_ZOOM, sy = Math.min(1, sourceAspect / aspect) / VIDEO_ZOOM;
  return [0.5 + (v - 0.5) * sx, 0.5 + (0.5 - u) * sy];
}
