import test from "node:test";
import assert from "node:assert/strict";
import { brewAt, trajectory, keyframe } from "../src/data/story";

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
