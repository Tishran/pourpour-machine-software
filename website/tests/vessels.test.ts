import test from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { nozzlePose, inspectionCamera } from "../src/data/story";
import {
  BED_RADIUS,
  BED_Y,
  carafeHandleCurve,
  dripperHandleCurve,
  filterGeometry,
} from "../src/experience/vesselGeometry";

test("nozzle stays below the housing and recenters for component inspection", () => {
  for (let i = 0; i <= 600; i++) {
    const stage = i / 100,
      pose = nozzlePose(stage);
    assert.equal(pose.y, 3.08);
    assert(pose.y + 0.15 < 3.268 - 0.065 / 2);
    assert(Math.hypot(pose.x, pose.z) <= 0.280001);
    if (stage >= 3) {
      assert.equal(Math.abs(pose.x), 0);
      assert.equal(Math.abs(pose.z), 0);
    }
  }
});

test("assembled inspection model stays inside desktop and portrait framing", () => {
  for (const mobile of [false, true]) {
    for (const aspect of [0.65, 0.9, 1.4]) {
      const camera = new PerspectiveCamera(36, aspect, 0.1, 100);
      camera.position.set(
        inspectionCamera.x * (mobile ? 0.84 : 1),
        inspectionCamera.y,
        inspectionCamera.z * (mobile ? 1.12 : 1),
      );
      camera.lookAt(0, inspectionCamera.targetY, 0.05);
      camera.updateMatrixWorld();
      for (const x of [-1.3, 1.3])
        for (const y of [0, 3.73])
          for (const z of [-1.05, 1.05]) {
            const point = new Vector3(x, y, z)
              .applyAxisAngle(new Vector3(0, 1, 0), 0.18)
              .project(camera);
            assert(Math.abs(point.x) < 0.95, `horizontal frame: ${point.x}`);
            assert(Math.abs(point.y) < 0.95, `vertical frame: ${point.y}`);
          }
    }
  }
});

test("coffee grounds and nozzle path fit inside the paper filter", () => {
  const filterRadiusAtBed = 0.059 + ((BED_Y - 1.48) / 0.68) * (0.496 - 0.059);
  assert(BED_RADIUS + 0.014 < filterRadiusAtBed);
  assert(0.28 + 0.013 < BED_RADIUS);
  const filter = filterGeometry();
  filter.computeBoundingBox();
  assert(filter.boundingBox!.max.y > 2.074);
  assert(filter.boundingBox!.min.y >= 1.47);
  filter.dispose();
});

test("handles attach at their two mounts and maintain vertical clearance", () => {
  const funnel = dripperHandleCurve(),
    glass = carafeHandleCurve();
  assert(Math.abs(funnel.getPoint(0).x - 0.475) < 1e-8);
  assert(Math.abs(funnel.getPoint(1).x - 0.313) < 1e-8);
  assert(Math.abs(glass.getPoint(0).x - 0.305) < 1e-8);
  assert(Math.abs(glass.getPoint(1).x - 0.483) < 1e-8);
  const funnelBottom =
    Math.min(...funnel.getPoints(100).map((p) => p.y)) - 0.038;
  const glassTop = Math.max(...glass.getPoints(100).map((p) => p.y)) + 0.039;
  assert(funnelBottom > glassTop + 0.2);
  assert(funnelBottom - 0.22 > glassTop - 0.45 + 0.2);
});
