import test from "node:test";
import assert from "node:assert/strict";
import {
  acts,
  brewAt,
  trajectory,
  keyframe,
  stageToScrollProgress,
} from "../src/data/story";

test("three pours deliver 300 ml with stationary volume during both pauses", () => {
  assert.equal(brewAt(0).volume, 0);
  assert.equal(brewAt(0.18).volume, 90);
  assert.equal(brewAt(0.3).volume, 90);
  assert.equal(brewAt(0.3).pouring, false);
  assert.equal(brewAt(0.65).volume, 200);
  assert.equal(brewAt(0.7).volume, 200);
  assert.equal(brewAt(0.7).pouring, false);
  assert.equal(brewAt(1).volume, 300);
  assert.equal(brewAt(1).pouring, false);
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const brew = brewAt(i / 1000);
    assert(brew.volume >= previous);
    assert(brew.volume <= 300);
    if (!brew.pouring) assert.equal(brew.flow, 0);
    previous = brew.volume;
  }
});
test("spiral stays within the coffee bed and circle holds a constant radius", () => {
  for (let i = 0; i <= 100; i++) {
    const spiral = trajectory(i / 100);
    assert(Math.hypot(spiral.x, spiral.z) <= 0.280001);
    const circle = trajectory(i / 100, "circle");
    assert(Math.abs(Math.hypot(circle.x, circle.z) - 0.075) < 0.00001);
  }
});
test("scroll keyframes hit precise mechanical endpoints in either direction", () => {
  assert.equal(keyframe([0, 1, 0], 0), 0);
  assert.equal(keyframe([0, 1, 0], 1), 1);
  assert.equal(keyframe([0, 1, 0], 2), 0);
  assert.equal(keyframe([0, 1, 0], 0.5), keyframe([0, 1, 0], 1.5));
});

test("longer scan and brew acts preserve navigation positions and slow stage progression", () => {
  const total = acts.slice(0, -1).reduce((sum, act) => sum + act.scrollVh, 0);
  let position = 0;
  acts.forEach((act, index) => {
    assert(Math.abs(stageToScrollProgress(index) - position / total) < 1e-10);
    position += act.scrollVh;
  });
  const distance = (stage: number) =>
    stageToScrollProgress(stage + 0.5) - stageToScrollProgress(stage);
  assert(Math.abs(distance(3) / distance(0) - 1.6) < 1e-10);
  assert(Math.abs(distance(4) / distance(0) - 1.8) < 1e-10);
  assert.equal(stageToScrollProgress(-1), 0);
  assert.equal(stageToScrollProgress(7), 1);
});
