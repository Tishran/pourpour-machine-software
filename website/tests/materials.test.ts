import test from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, ExtrudeGeometry, Shape, ShaderChunk } from "three";
import {
  materialPresets,
  roughnessTexel,
  scaleBoxUVs,
} from "../src/experience/materialPresets";
import { qualitySettings } from "../src/experience/RenderingQuality";
import { reservoirProfile } from "../src/experience/vesselGeometry";

test("surface families retain distinct physical responses", () => {
  for (const key of [
    "brushedSteel",
    "machinedSteel",
    "polishedSteel",
    "copper",
  ] as const) {
    assert.equal(materialPresets[key].physical.metalness, 1);
    assert(materialPresets[key].physical.roughness < 0.4);
  }
  assert.equal(materialPresets.powderCoat.physical.metalness, 0);
  assert(
    materialPresets.rubber.physical.roughness >
      materialPresets.abs.physical.roughness + 0.3,
  );
  for (const key of ["glass", "acrylic", "water"] as const) {
    assert.equal(materialPresets[key].physical.opacity, 1);
    assert.equal(materialPresets[key].physical.transmission, 1);
    assert(materialPresets[key].physical.ior > 1);
    assert(materialPresets[key].physical.roughness < 0.1);
  }
});

test("roughness masks keep every texel inside its material's narrow range", () => {
  for (const preset of Object.values(materialPresets)) {
    if (!("roughnessFloor" in preset)) continue;
    let previous = 0;
    for (let pixel = 0; pixel <= 255; pixel++) {
      const value = roughnessTexel(pixel, preset.roughnessFloor);
      assert(value >= Math.round(255 * preset.roughnessFloor));
      assert(value <= 255);
      assert(value >= previous);
      previous = value;
    }
  }
});

test("model-space UVs work with both box and Drei-style extruded faces", () => {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(2, 0);
  shape.lineTo(2, 3);
  shape.lineTo(0, 3);
  shape.closePath();
  const geometries = [
    new BoxGeometry(2, 3, 0.4).toNonIndexed(),
    new ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false }),
  ];
  for (const geometry of geometries) {
    geometry.center();
    scaleBoxUVs(geometry, [2, 3, 0.4]);
    const position = geometry.getAttribute("position"),
      uv = geometry.getAttribute("uv");
    for (let i = 0; i < position.count; i += 3) {
      const world = Math.hypot(
        position.getX(i) - position.getX(i + 1),
        position.getY(i) - position.getY(i + 1),
        position.getZ(i) - position.getZ(i + 1),
      );
      const mapped = Math.hypot(
        uv.getX(i) - uv.getX(i + 1),
        uv.getY(i) - uv.getY(i + 1),
      );
      assert(Math.abs(world - mapped) < 0.00001);
    }
    const first = Array.from(uv.array);
    scaleBoxUVs(geometry, [2, 3, 0.4]); // StrictMode must not rescale a second time.
    assert.deepEqual(Array.from(uv.array), first);
    geometry.dispose();
  }
});

test("transmission adapter's shader hook matches the installed Three version", () => {
  // Fail on a library upgrade that would silently reintroduce white glass.
  assert(
    ShaderChunk.transmission_pars_fragment.includes(
      "return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );",
    ),
  );
  assert(
    ShaderChunk.opaque_fragment.includes(
      "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
    ),
  );
});

test("quality presets respect the DPR budget and reduce screen-space costs", () => {
  for (const preset of Object.values(qualitySettings)) {
    assert(preset.dpr <= 1.5);
    assert(preset.shadowSize <= 1024);
    assert(preset.environmentSize <= 256);
  }
  assert.equal(qualitySettings.low.dpr, 1);
  assert(
    qualitySettings.medium.transmissionScale <
      qualitySettings.high.transmissionScale,
  );
});

test("reservoir has a closed thin wall without changing its outer dimensions", () => {
  assert(reservoirProfile[0].equals(reservoirProfile.at(-1)!));
  assert.equal(Math.max(...reservoirProfile.map((p) => p.x)), 0.37);
  assert.equal(Math.max(...reservoirProfile.map((p) => p.y)), 1.4);
  assert.equal(Math.min(...reservoirProfile.map((p) => p.y)), -1.4);
  assert(
    Math.max(...reservoirProfile.map((p) => p.x)) -
      Math.min(...reservoirProfile.map((p) => p.x)) <
      0.025,
  );
});
