import * as THREE from "three";

type SurfacePreset = {
  physical: THREE.MeshPhysicalMaterialParameters;
  maps?: "grain" | "metal" | "paper";
  density?: readonly [number, number];
  normalStrength?: number;
  roughnessFloor?: number;
  albedo?: boolean;
};

export const materialPresets = {
  powderCoat: {
    physical: {
      color: "#dedbd1",
      metalness: 0,
      roughness: 0.38,
      clearcoat: 0.09,
      clearcoatRoughness: 0.34,
    },
    maps: "grain",
    density: [7, 7],
    normalStrength: 0.075,
    roughnessFloor: 0.9,
  },
  brushedSteel: {
    physical: {
      color: "#c7cdce",
      metalness: 1,
      roughness: 0.31,
      anisotropy: 0.65,
    },
    maps: "metal",
    density: [3, 5],
    normalStrength: 0.055,
    roughnessFloor: 0.78,
  },
  machinedSteel: {
    physical: {
      color: "#cbd0d0",
      metalness: 1,
      roughness: 0.24,
      anisotropy: 0.4,
    },
    maps: "metal",
    density: [5, 3],
    normalStrength: 0.035,
    roughnessFloor: 0.86,
  },
  polishedSteel: {
    physical: { color: "#d1d5d5", metalness: 1, roughness: 0.16 },
    maps: "metal",
    density: [6, 6],
    normalStrength: 0.012,
    roughnessFloor: 0.94,
  },
  copper: {
    physical: {
      color: "#e1aa87",
      metalness: 1,
      roughness: 0.29,
      anisotropy: 0.35,
    },
    maps: "metal",
    density: [5, 4],
    normalStrength: 0.04,
    roughnessFloor: 0.85,
  },
  abs: {
    physical: { color: "#30332f", metalness: 0, roughness: 0.46, ior: 1.53 },
    maps: "grain",
    density: [9, 9],
    normalStrength: 0.04,
    roughnessFloor: 0.92,
  },
  rubber: {
    physical: {
      color: "#242723",
      metalness: 0,
      roughness: 0.88,
      specularIntensity: 0.45,
    },
    maps: "grain",
    density: [12, 12],
    normalStrength: 0.085,
    roughnessFloor: 0.88,
  },
  ceramic: {
    physical: {
      color: "#e6e0d3",
      metalness: 0,
      roughness: 0.23,
      clearcoat: 0.28,
      clearcoatRoughness: 0.2,
    },
    maps: "grain",
    density: [5, 5],
    normalStrength: 0.015,
    roughnessFloor: 0.97,
  },
  glass: {
    physical: {
      color: "#ffffff",
      metalness: 0,
      roughness: 0.035,
      transmission: 1,
      opacity: 1,
      ior: 1.47,
      thickness: 0.022,
      attenuationColor: "#f1f8f5",
      attenuationDistance: 6,
      envMapIntensity: 1.1,
    },
  },
  acrylic: {
    physical: {
      color: "#ffffff",
      metalness: 0,
      roughness: 0.065,
      transmission: 1,
      opacity: 1,
      ior: 1.49,
      thickness: 0.025,
      attenuationColor: "#eef6f1",
      attenuationDistance: 4,
      envMapIntensity: 1.05,
    },
  },
  water: {
    physical: {
      color: "#ffffff",
      metalness: 0,
      roughness: 0.045,
      transmission: 1,
      opacity: 1,
      ior: 1.333,
      thickness: 0.02,
      attenuationColor: "#f2faf5",
      attenuationDistance: 8,
      envMapIntensity: 1.15,
    },
  },
  kraftPaper: {
    physical: {
      color: "#a98259",
      metalness: 0,
      roughness: 0.91,
      specularIntensity: 0.4,
    },
    maps: "paper",
    density: [2, 2],
    normalStrength: 0.12,
    roughnessFloor: 0.86,
    albedo: true,
  },
  filterPaper: {
    physical: {
      color: "#f1e5cd",
      metalness: 0,
      roughness: 0.96,
      specularIntensity: 0.35,
      side: THREE.DoubleSide,
    },
    maps: "paper",
    density: [3, 3],
    normalStrength: 0.11,
    roughnessFloor: 0.91,
    albedo: true,
  },
} satisfies Record<string, SurfacePreset>;

export type SurfaceType = keyof typeof materialPresets;
export function surfacePreset(surface: SurfaceType): SurfacePreset {
  return materialPresets[surface];
}

// Roughness maps multiply the scalar. Restrict their range so photographic
// contrast cannot accidentally turn a powder coating into polished plastic.
export function roughnessTexel(value: number, floor: number) {
  return Math.round(255 * (floor + ((1 - floor) * value) / 255));
}

// Project each triangle in model space rather than assuming a particular
// RoundedBox implementation: Drei uses ExtrudeGeometry, not Three's box UVs.
// All faces use the same physical density; bevel seams are subpixel micrograin.
export function scaleBoxUVs(
  geometry: THREE.BufferGeometry,
  size: readonly number[],
) {
  if (geometry.userData.surfaceUVs) return;
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < position.count; i += 3) {
    const nx = Math.abs(
      normal.getX(i) + normal.getX(i + 1) + normal.getX(i + 2),
    );
    const ny = Math.abs(
      normal.getY(i) + normal.getY(i + 1) + normal.getY(i + 2),
    );
    const nz = Math.abs(
      normal.getZ(i) + normal.getZ(i + 1) + normal.getZ(i + 2),
    );
    for (let j = i; j < i + 3; j++) {
      if (nx > ny && nx > nz)
        uv.setXY(
          j,
          position.getZ(j) + size[2] / 2,
          position.getY(j) + size[1] / 2,
        );
      else if (ny > nz)
        uv.setXY(
          j,
          position.getX(j) + size[0] / 2,
          position.getZ(j) + size[2] / 2,
        );
      else
        uv.setXY(
          j,
          position.getX(j) + size[0] / 2,
          position.getY(j) + size[1] / 2,
        );
    }
  }
  uv.needsUpdate = true;
  geometry.userData.surfaceUVs = true;
}
