import test from "node:test";
import assert from "node:assert/strict";
import {
  acts,
  brewAt,
  trajectory,
  keyframe,
  stageToScrollProgress,
  scanAt,
} from "../src/data/story";

test("bag scans during Different coffee and clears before pouring", () => {
  assert.equal(scanAt(0).visibility, 0);
  assert.equal(scanAt(1).visibility, 1);
  assert.equal(scanAt(1).progress, 0);
  assert(scanAt(1.5).progress > 0);
  assert.equal(scanAt(1.6).progress, 1);
  assert.equal(scanAt(1.6).visibility, 1);
  assert.equal(scanAt(1.85).visibility, 0);
});

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

test("scroll progress follows measured sections without extra pinned distance", () => {
  const heights = [800, 900, 1200, 1000, 1100, 800];
  const total = heights.slice(0, -1).reduce((sum, height) => sum + height, 0);
  let position = 0;
  heights.forEach((height, index) => {
    assert(
      Math.abs(stageToScrollProgress(index, heights) - position / total) <
        1e-10,
    );
    position += height;
  });
  assert.equal(stageToScrollProgress(-1, heights), 0);
  assert.equal(stageToScrollProgress(7, heights), 1);
});

test("story starts with the ritual and ends with mechanics then launch", () => {
  assert.deepEqual(
    acts.map((act) => act.id),
    ["object", "purpose", "brew", "engineering", "launch"],
  );
});
