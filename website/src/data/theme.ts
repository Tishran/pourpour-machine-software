type RGB = readonly [number, number, number];
const dark: RGB = [23, 24, 21];
const light: RGB = [242, 237, 227];
export function luminance(rgb: RGB) {
  const channels = rgb.map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrast(a: RGB, b: RGB) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function themeAt(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const background = dark.map((v, i) => Math.round(v + (light[i] - v) * p)) as [
    number,
    number,
    number,
  ];
  // Never interpolate text through the background color. Keep the brand
  // colors where accessible, using white/black only for intermediate tones.
  const candidates: RGB[] = [light, dark, [255, 255, 255], [0, 0, 0]];
  const foreground = candidates.find(
    (color) => contrast(color, background) >= 4.5,
  )!;
  return { background, foreground };
}
