import * as THREE from "three";

export const CENTER_Z = 0.3;
export const BED_Y = 1.94;
export const BED_RADIUS = 0.34;
export const CARAFE_BOTTOM = 0.36;

export const dripperProfile = [
  [0.088, 1.405],
  [0.122, 1.405],
  [0.147, 1.46],
  [0.514, 2.035],
  [0.523, 2.054],
  [0.519, 2.068],
  [0.503, 2.074],
  [0.487, 2.064],
  [0.476, 2.034],
  [0.105, 1.46],
  [0.083, 1.423],
  [0.088, 1.405],
].map(([r, y]) => new THREE.Vector2(r, y));

// Outside → rounded rim → inside → solid bottom. The vessel is hollow, not a single sheet.
export const carafeProfile = [
  [0, 0],
  [0.3, 0],
  [0.445, 0.025],
  [0.488, 0.07],
  [0.492, 0.16],
  [0.468, 0.4],
  [0.33, 0.72],
  [0.267, 0.82],
  [0.267, 0.99],
  [0.255, 1.002],
  [0.244, 0.985],
  [0.245, 0.83],
  [0.31, 0.73],
  [0.446, 0.4],
  [0.466, 0.16],
  [0.462, 0.085],
  [0.428, 0.047],
  [0, 0.044],
  [0, 0],
].map(([r, y]) => new THREE.Vector2(r, y));

function bezier(points: number[][]) {
  return new THREE.CubicBezierCurve3(
    ...(points.map((p) => new THREE.Vector3(...p)) as [
      THREE.Vector3,
      THREE.Vector3,
      THREE.Vector3,
      THREE.Vector3,
    ]),
  );
}
export function dripperHandleCurve() {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  curve.add(
    bezier([
      [0.475, 1.99, 0],
      [0.74, 2.065, 0],
      [0.93, 1.87, 0],
      [0.69, 1.72, 0],
    ]),
  );
  curve.add(
    bezier([
      [0.69, 1.72, 0],
      [0.5, 1.6, 0],
      [0.39, 1.66, 0],
      [0.313, 1.72, 0],
    ]),
  );
  return curve;
}
export function carafeHandleCurve() {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  curve.add(
    bezier([
      [0.305, 1.14, 0],
      [0.57, 1.23, 0],
      [0.82, 1.19, 0],
      [0.82, 0.93, 0],
    ]),
  );
  curve.add(
    bezier([
      [0.82, 0.93, 0],
      [0.83, 0.66, 0],
      [0.72, 0.51, 0],
      [0.483, 0.62, 0],
    ]),
  );
  return curve;
}

// Filter sits inside the ceramic and extends above it. Normals are recalculated after the paper edge is shaped.
export function filterGeometry() {
  const geometry = new THREE.CylinderGeometry(0.496, 0.059, 0.68, 96, 16, true);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i),
      y = positions.getY(i);
    const top = Math.max(0, (y + 0.34) / 0.68);
    const angle = Math.atan2(z, x);
    positions.setY(
      i,
      y +
        1.82 +
        Math.pow(top, 6) *
          (0.006 * Math.sin(angle * 3) + 0.003 * Math.sin(angle * 7)),
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}
