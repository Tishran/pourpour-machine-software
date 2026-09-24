'use strict';
// First Brew personal taste model. It learns only from this person's own cups, on this device.
//
// Two axes, both measured in the engine's own correction steps from the first recipe of a series
// (one coffee on one brewer):
//   extraction: +1 = water 2 °C hotter or the grind one step finer (more is pulled from the coffee);
//   ratio:      +1 = 0.5 more grams of water per gram of coffee (a lighter cup).
// Each rating says on which side of the person's sweet spot the cup was: "sour/hollow" means the
// spot has more extraction, "bitter/dry" less, "balanced" or "sweet" means close to it. An experiment
// says which of two cups was closer. A grid posterior (Bayes' rule) keeps every possible spot with
// its probability, so the uncertainty is shown, not hidden. Across coffees, the typical offset from
// the starting recipes becomes the prior for the next coffee.
(function (root) {
  const RANGE = 8;        // steps either side of the first recipe
  const STEP = 0.05;      // grid resolution
  const PRIOR_SD = 2.5;   // before any cup: the sweet spot is probably within a few steps
  const SLOPE = 0.35;     // how sharp "too sour" / "too bitter" is around a cup
  const OK_SD = 0.75;     // "balanced": the spot is within about a step
  const SAME_SD = 1.5;    // "no difference" between two cups: a weak hint that both are close
  const PAIR_SLOPE = 0.5;
  const MARGIN = 0.5;     // within half a step of the spot counts as "on target"

  const GRID = [];
  for (let u = -RANGE; u <= RANGE + 1e-9; u += STEP) GRID.push(Math.round(u * 100) / 100);
  const sigmoid = z => 1 / (1 + Math.exp(-z));
  const bell = (z, sd) => Math.exp(-0.5 * (z / sd) ** 2);

  // How likely one observation is if the sweet spot is at u.
  function likelihood(obs, u) {
    if (obs.kind === 'under') return sigmoid((u - obs.x) / SLOPE);
    if (obs.kind === 'over') return sigmoid((obs.x - u) / SLOPE);
    if (obs.kind === 'ok') return bell(u - obs.x, OK_SD);
    if (obs.kind === 'pair') {
      const mid = (obs.a + obs.b) / 2;
      if (obs.choice === 'same' || obs.a === obs.b) return bell(u - mid, SAME_SD);
      const chosen = obs.choice === 'b' ? obs.b : obs.a, other = obs.choice === 'b' ? obs.a : obs.b;
      return sigmoid((u - mid) * Math.sign(chosen - other) / PAIR_SLOPE);
    }
    return 1;
  }

  function summary(density) {
    const quantile = q => {
      let total = 0;
      for (let i = 0; i < GRID.length; i++) { total += density[i]; if (total >= q) return GRID[i]; }
      return GRID[GRID.length - 1];
    };
    const mean = density.reduce((sum, p, i) => sum + p * GRID[i], 0);
    return {mean, median: quantile(0.5), low: quantile(0.1), high: quantile(0.9)};
  }

  // The posterior over the sweet spot after the observations, starting from a prior.
  function fit(observations, prior = {mean: 0, sd: PRIOR_SD}) {
    let weights = GRID.map(u => bell(u - prior.mean, prior.sd));
    for (const obs of observations) weights = weights.map((w, i) => w * likelihood(obs, GRID[i]));
    let total = weights.reduce((sum, w) => sum + w, 0);
    if (!(total > 0)) { weights = GRID.map(u => bell(u - prior.mean, prior.sd)); total = weights.reduce((a, b) => a + b, 0); }
    const density = weights.map(w => w / total);
    return {grid: GRID, density, prior, n: observations.length, ...summary(density)};
  }

  // For a cup at position x: the chances it tastes sour/hollow, on target, or bitter/dry.
  function chances(posterior, x) {
    let sour = 0, bitter = 0;
    posterior.density.forEach((p, i) => {
      if (GRID[i] > x + MARGIN) sour += p;
      else if (GRID[i] < x - MARGIN) bitter += p;
    });
    return {sour, ok: Math.max(0, 1 - sour - bitter), bitter};
  }

  // What a rating says on each axis. Strength without sweetness says nothing (the engine's rule).
  const KINDS = {
    extraction: {under: 'under', over: 'over', on_target: 'ok', weak_after_sweet: 'ok', heavy_after_sweet: 'ok'},
    // On the ratio axis "watery" wants less water (the spot is below), "heavy" wants more.
    ratio: {weak_after_sweet: 'over', heavy_after_sweet: 'under', on_target: 'ok'},
  };

  // Journal entries (newest first) → series of observations, positions relative to each series' first cup.
  function seriesOf(entries, axis) {
    const groups = new Map();
    [...entries].reverse().forEach(entry => {
      const features = entry.features;
      const value = features?.[axis];
      if (!features?.series || typeof value !== 'number' || !Number.isFinite(value)) return;
      if (!groups.has(features.series)) groups.set(features.series, {key: features.series, label: entry.coffee, start: value, observations: [], cups: 0});
      const group = groups.get(features.series);
      group.cups++;
      group.last = value - group.start;
      const kind = KINDS[axis][entry.diagnosis_code];
      if (kind) group.observations.push({kind, x: value - group.start, at: entry.at});
      const pair = entry.pair;
      if (pair?.axis === axis && ['a', 'b', 'same'].includes(pair.choice) && Number.isFinite(pair.a) && Number.isFinite(pair.b)) {
        group.observations.push({kind: 'pair', a: pair.a - group.start, b: pair.b - group.start, choice: pair.choice, at: entry.at});
      }
    });
    return [...groups.values()];
  }

  // The usual offset of the sweet spot from the starting recipes, shrunk toward zero with few coffees.
  function tendency(groups, exceptKey = null) {
    const medians = groups.filter(group => group.key !== exceptKey && group.observations.length)
      .map(group => fit(group.observations).median);
    const value = medians.reduce((sum, m) => sum + m, 0) / (medians.length + 1);
    return {value, coffees: medians.length};
  }

  // Everything the app shows about one axis: each series with its posterior and the tendency.
  function analyze(entries, axis = 'extraction') {
    const groups = seriesOf(entries, axis);
    const all = tendency(groups);
    for (const group of groups) {
      const prior = {mean: tendency(groups, group.key).value, sd: PRIOR_SD};
      group.fit = fit(group.observations, prior);
      group.before = group.observations.length ? fit(group.observations.slice(0, -1), prior) : null;
    }
    return {axis, series: groups, tendency: all};
  }

  const api = {analyze, fit, chances, seriesOf, tendency, GRID, MARGIN, PRIOR_SD};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TasteModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
