export const acts = [
  { id: "object", label: "The object" },
  { id: "purpose", label: "The ritual" },
  { id: "brew", label: "The pour" },
  { id: "engineering", label: "The mechanics" },
  { id: "launch", label: "Your morning" },
] as const;

// Match the scene to actual section heights, without invisible scroll padding.
export function stageToScrollProgress(
  stage: number,
  heights: readonly number[],
) {
  const outgoing = heights.slice(0, -1);
  const total = outgoing.reduce((sum, height) => sum + height, 0);
  const s = Math.max(0, Math.min(outgoing.length, stage));
  const index = Math.floor(s);
  const before = outgoing
    .slice(0, index)
    .reduce((sum, height) => sum + height, 0);
  return (before + (outgoing[index] ?? 0) * (s - index)) / total;
}
export type Part =
  "heater" | "flow" | "nozzle" | "reservoir" | "dripper" | "scale" | null;
export const inspectionCamera = { x: 5, y: 4.6, z: 8.2, targetY: 2.06 };
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
export const brewProgress = (stage: number) => clamp((stage - 1.85) / 0.98);

// Keep the nozzle mounted below the housing. Only its horizontal pour path
// moves; it recenters before the component study, never lifting through the arm.
export function nozzlePose(stage: number) {
  const brew = brewAt(brewProgress(stage));
  const travel =
    smooth((stage - 1.75) / 0.1) * (1 - smooth((stage - 2.83) / 0.17));
  return { x: brew.x * travel, y: 3.08, z: brew.z * travel };
}

// Introduce and scan the bag during the ritual, then hold it for the recipe.
export function scanAt(stage: number) {
  return {
    visibility:
      smooth((stage - 0.72) / 0.28) * (1 - smooth((stage - 1.65) / 0.17)),
    progress: clamp((stage - 1) / 0.6),
  };
}
