import test from "node:test";
import assert from "node:assert/strict";
import {
  BED_RADIUS,
  BED_Y,
  carafeHandleCurve,
  dripperHandleCurve,
  filterGeometry,
} from "../src/experience/vesselGeometry";

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
