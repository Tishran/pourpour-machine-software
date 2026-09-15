export const acts = [
  { id: "object", label: "The object", scrollVh: 150 },
  { id: "physical", label: "The recipe", scrollVh: 150 },
  { id: "engineering", label: "The mechanics", scrollVh: 150 },
  { id: "scan", label: "The coffee", scrollVh: 240 },
  { id: "brew", label: "The pour", scrollVh: 270 },
  { id: "purpose", label: "The ritual", scrollVh: 150 },
  { id: "launch", label: "Your morning", scrollVh: 100 },
] as const;

// The final viewport has no outgoing transition. Longer acts advance less per scroll pixel.
export function stageToScrollProgress(stage: number) {
  const outgoing = acts.slice(0, -1);
  const total = outgoing.reduce((sum, act) => sum + act.scrollVh, 0);
  const s = Math.max(0, Math.min(outgoing.length, stage));
  const index = Math.floor(s);
  const before = outgoing
    .slice(0, index)
    .reduce((sum, act) => sum + act.scrollVh, 0);
  return (before + (outgoing[index]?.scrollVh ?? 0) * (s - index)) / total;
}
export type Part =
  "heater" | "flow" | "nozzle" | "reservoir" | "dripper" | "scale" | null;
export const story = {
  stage: 0,
  light: 0,
  highlight: null as Part,
  reduced: false,
  pointer: { x: 0, y: 0 },
};
export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));
export const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function keyframe(values: readonly number[], stage: number) {
  const i = Math.min(
    values.length - 2,
    Math.floor(clamp(stage, 0, values.length - 1)),
  );
  return mix(values[i], values[i + 1], smooth(stage - i));
}
// Shared by the nozzle and the line over the bed. Coordinates are in model units.
export function trajectory(
  progress: number,
  kind: "circle" | "spiral" = "spiral",
) {
  const p = clamp(progress);
  const radius = kind === "circle" ? 0.075 : 0.035 + p * 0.245;
  const angle = p * Math.PI * (kind === "circle" ? 4 : 7);
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}
export function brewAt(progress: number) {
  const p = clamp(progress);
  // 90 + 110 + 100 ml. Bloom is included in pour 01, not additional water.
  if (p < 0.18)
    return {
      ...trajectory(p / 0.18, "circle"),
      pouring: true,
      volume: (90 * p) / 0.18,
      phase: "01 / CENTER POUR",
      flow: 5,
      pulse: 1,
    };
  if (p < 0.37)
    return {
      ...trajectory(1, "circle"),
      pouring: false,
      volume: 90,
      phase: "BLOOM / PAUSE",
      flow: 0,
      pulse: 1,
    };
  if (p < 0.65)
    return {
      ...trajectory((p - 0.37) / 0.28),
      pouring: true,
      volume: 90 + (110 * (p - 0.37)) / 0.28,
      phase: "02 / SPIRAL POUR",
      flow: 4.8,
      pulse: 2,
    };
  if (p < 0.73)
    return {
      ...trajectory(1),
      pouring: false,
      volume: 200,
      phase: "DRAWDOWN / PAUSE",
      flow: 0,
      pulse: 2,
    };
  return {
    ...trajectory((p - 0.73) / 0.27),
    pouring: p < 0.999,
    volume: 200 + (100 * (p - 0.73)) / 0.27,
    phase: p >= 0.999 ? "POUR COMPLETE" : "03 / OUTWARD POUR",
    flow: p >= 0.999 ? 0 : 4.5,
    pulse: 3,
  };
}
export const brewProgress = (stage: number) => clamp((stage - 3.85) / 0.98);
