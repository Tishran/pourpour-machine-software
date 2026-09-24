// Personal taste model: run with `node --test webapp/tests/test_taste_model.cjs`
// (also run by tests/test_taste_model.py inside the Python suite).
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../static/taste-model.js');

const cup = (series, extraction, code, extra = {}) => ({coffee: series, at: new Date().toISOString(),
  diagnosis_code: code, features: {series, extraction, ratio: 34}, ...extra});
// Journal order: newest first.
const journal = cups => [...cups].reverse();
const width = fit => fit.high - fit.low;

test('without cups the model only knows its prior', () => {
  const fit = model.fit([]);
  assert.ok(Math.abs(fit.median) < 0.1);
  assert.ok(width(fit) > 5, 'wide: it does not know the taste yet');
});

test('sour at the start moves the sweet spot to more extraction', () => {
  const fit = model.fit([{kind: 'under', x: 0}]);
  assert.ok(fit.median > 0.5);
  const chances = model.chances(fit, 0);
  assert.ok(chances.sour > chances.bitter);
});

test('sour then bitter brackets the sweet spot between the two cups', () => {
  const fit = model.fit([{kind: 'under', x: 0}, {kind: 'over', x: 2}]);
  assert.ok(fit.median > 0.3 && fit.median < 1.7, fit.median);
  assert.ok(width(fit) < width(model.fit([{kind: 'under', x: 0}])), 'more cups, less uncertainty');
});

test('a balanced cup pins the spot and makes that cup likely on target', () => {
  const fit = model.fit([{kind: 'under', x: 0}, {kind: 'ok', x: 2}]);
  assert.ok(Math.abs(fit.median - 2) < 0.6);
  const at = model.chances(fit, 2), away = model.chances(fit, -2);
  assert.ok(at.ok > away.ok);
  assert.ok(away.sour > 0.8);
});

test('an experiment choice points toward the preferred cup', () => {
  const finer = model.fit([{kind: 'pair', a: 0, b: 1, choice: 'b'}]);
  const coarser = model.fit([{kind: 'pair', a: 0, b: 1, choice: 'a'}]);
  assert.ok(finer.median > coarser.median);
  const same = model.fit([{kind: 'pair', a: 0, b: 1, choice: 'same'}]);
  assert.ok(Math.abs(same.median - 0.5) < 0.3);
});

test('journal entries become series relative to their first cup', () => {
  const entries = journal([cup('Кения', 10, 'under'), cup('Кения', 12, 'over'), cup('Колумбия', -3, 'on_target'),
    cup('Кения', 11, 'strength_needs_sweetness'), {coffee: 'x', diagnosis_code: 'under'}]);
  const result = model.analyze(entries, 'extraction');
  const kenya = result.series.find(group => group.key === 'Кения');
  assert.deepEqual(kenya.observations.map(o => [o.kind, o.x]), [['under', 0], ['over', 2]]);
  assert.equal(kenya.cups, 3, 'strength without sweetness is a cup, not an observation');
  assert.ok(kenya.fit.median > 0 && kenya.fit.median < 2);
  assert.ok(kenya.before, 'the posterior before the last cup is kept for the chart');
});

test('the tendency from other coffees becomes the prior for a new coffee', () => {
  const entries = journal([cup('A', 0, 'under'), cup('A', 2, 'on_target'), cup('B', 5, 'under'), cup('B', 7, 'on_target'),
    cup('C', 1, 'strength_needs_sweetness')]);
  const result = model.analyze(entries);
  assert.equal(result.tendency.coffees, 2);
  assert.ok(result.tendency.value > 0.8, 'this person usually wants more extraction than the start');
  const fresh = result.series.find(group => group.key === 'C');
  assert.ok(fresh.fit.median > 0.8, 'a new coffee starts from what was learned');
  assert.equal(fresh.fit.n, 0);
});

test('the ratio axis reads watery and heavy only after sweetness', () => {
  const entries = journal([
    {coffee: 'A', diagnosis_code: 'weak_after_sweet', features: {series: 'A', extraction: 0, ratio: 34}},
    {coffee: 'A', diagnosis_code: 'under', features: {series: 'A', extraction: 0, ratio: 33}}]);
  const ratio = model.analyze(entries, 'ratio').series[0];
  assert.deepEqual(ratio.observations.map(o => o.kind), ['over'], 'watery: less water; sourness says nothing about ratio');
  assert.ok(ratio.fit.median < 0);
});

test('experiment pairs in the journal feed the model', () => {
  const entries = journal([cup('lesson', 0, null), cup('lesson', 1, null, {pair: {axis: 'extraction', a: 0, b: 1, choice: 'b'}})]);
  const group = model.analyze(entries).series[0];
  assert.equal(group.observations[0].kind, 'pair');
  assert.ok(group.fit.median > 0.5);
});
