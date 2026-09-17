import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { story, type Part } from "../data/story";
import {
  roughnessTexel,
  surfacePreset,
  type SurfaceType,
} from "./materialPresets";
import { useRenderQuality } from "./RenderingQuality";

const textureFiles = {
  metalNormal: "/textures/brushed-metal-normal.jpg",
  metalRoughness: "/textures/brushed-metal-roughness.jpg",
  grainNormal: "/textures/surface-grain-normal.jpg",
  grainRoughness: "/textures/surface-grain-roughness.jpg",
  paperColor: "/textures/filter-paper-color.jpg",
  paperNormal: "/textures/filter-paper-normal.jpg",
};
type SourceMaps = Record<keyof typeof textureFiles, THREE.Texture>;
type Maps = {
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  map?: THREE.Texture;
};
type SurfaceLibrary = {
  get: (surface: SurfaceType, u: number, v: number, axial: boolean) => Maps;
};
const Surfaces = createContext<SurfaceLibrary | null>(null);

function configure(
  texture: THREE.Texture,
  u: number,
  v: number,
  color = false,
) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(u, v);
  texture.anisotropy = 4;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function roughnessMap(source: THREE.Texture, floor: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(source.image as HTMLImageElement, 0, 0, 256, 256);
  const image = context.getImageData(0, 0, 256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    // Paper fibers supply only a narrow variation mask, not measured roughness.
    const value = roughnessTexel(image.data[i + 1], floor);
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
  }
  context.putImageData(image, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

function createLibrary(loaded: SourceMaps) {
  const variants = new Map<string, Maps>();
  const roughnessSources = new Map<SurfaceType, THREE.Texture>();
  return {
    get(surface: SurfaceType, u: number, v: number, axial: boolean): Maps {
      const key = surface + ":" + u + ":" + v + ":" + axial;
      const cached = variants.get(key);
      if (cached) return cached;
      const preset = surfacePreset(surface);
      if (!preset.maps || !preset.density) return {};
      const family = preset.maps;
      const repeatU = preset.density[0] * u,
        repeatV = preset.density[1] * v;
      // Loader textures are shared globally: never mutate their UV transforms.
      const normalMap = configure(
        loaded[`${family}Normal`].clone(),
        repeatU,
        repeatV,
      );
      let source = roughnessSources.get(surface);
      if (!source) {
        source = roughnessMap(
          family === "paper" ? loaded.paperColor : loaded[`${family}Roughness`],
          preset.roughnessFloor ?? 0.9,
        );
        roughnessSources.set(surface, source);
      }
      const maps: Maps = {
        normalMap,
        roughnessMap: configure(source.clone(), repeatU, repeatV),
      };
      if (preset.albedo)
        maps.map = configure(loaded.paperColor.clone(), repeatU, repeatV, true);
      if (axial && family === "metal") {
        for (const map of Object.values(maps)) {
          map.center.set(0.5, 0.5);
          map.rotation = Math.PI / 2;
        }
      }
      variants.set(key, maps);
      return maps;
    },
    dispose() {
      for (const maps of variants.values())
        for (const texture of Object.values(maps)) texture.dispose();
      for (const texture of roughnessSources.values()) texture.dispose();
      // Keep identities for React StrictMode's cleanup/setup rehearsal. Disposed
      // GPU textures are uploaded again on reuse; the loader cache is untouched.
    },
  };
}

export function SurfaceProvider({ children }: { children: ReactNode }) {
  const loaded = useTexture(textureFiles);
  const library = useMemo(() => createLibrary(loaded), [loaded]);
  useEffect(() => () => library.dispose(), [library]);
  return <Surfaces.Provider value={library}>{children}</Surfaces.Provider>;
}

export function Finish({
  surface,
  color,
  part,
  uvScale = [1, 1],
  axial = false,
  thickness,
  cheap = false,
}: {
  surface: SurfaceType;
  color?: string;
  part?: Part;
  uvScale?: readonly [number, number];
  axial?: boolean;
  thickness?: number;
  cheap?: boolean;
}) {
  const ref = useRef<THREE.MeshPhysicalMaterial>(null);
  const library = useContext(Surfaces);
  const quality = useRenderQuality();
  if (!library) throw new Error("Surface materials need SurfaceProvider");
  const preset = surfacePreset(surface);
  const maps = library.get(surface, uvScale[0], uvScale[1], axial);
  const optical = Boolean(preset.physical.transmission);
  const approximation = optical && (quality === "low" || cheap);
  const configureOptics = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      if (!optical) return;
      if (!approximation) {
        // r183 clears its shared transmission target to half-alpha white on an
        // alpha canvas. Remove that sentinel's contribution (not actual scene
        // objects) so the page shows through instead of turning the glass milky.
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <transmission_pars_fragment>",
          THREE.ShaderChunk.transmission_pars_fragment.replace(
            "return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );",
            `vec4 sampleColor = textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
           float uncovered = clamp(2.0 * (1.0 - sampleColor.a), 0.0, 1.0);
           sampleColor.rgb = max(vec3(0.0), sampleColor.rgb - vec3(0.5 * uncovered));
           sampleColor.a = 1.0 - uncovered;
           return sampleColor;`,
          ),
        );
      }
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
       float grazing = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 5.0);
       ${
         approximation
           ? "gl_FragColor.a = mix(opacity, 0.65, grazing);"
           : "gl_FragColor.a = mix(gl_FragColor.a, 1.0, 0.04 + 0.96 * grazing);"
       }`,
      );
    },
    [approximation, optical],
  );
  useFrame((_, delta) => {
    if (ref.current) {
      const target = part && story.highlight === part ? 0.45 : 0;
      ref.current.emissiveIntensity = story.reduced
        ? target
        : THREE.MathUtils.damp(
            ref.current.emissiveIntensity,
            target,
            10,
            delta,
          );
    }
  });
  return (
    <meshPhysicalMaterial
      ref={ref}
      {...preset.physical}
      {...maps}
      {...(color ? { color } : {})}
      {...(thickness !== undefined ? { thickness } : {})}
      {...(axial ? { anisotropyRotation: Math.PI / 2 } : {})}
      {...(approximation
        ? {
            transmission: 0,
            thickness: 0,
            transparent: true,
            opacity: surface === "water" ? 0.035 : 0.055,
            depthWrite: false,
            side: THREE.FrontSide,
            envMapIntensity: 1.5,
          }
        : {})}
      normalScale={[preset.normalStrength ?? 0, preset.normalStrength ?? 0]}
      emissive="#b87542"
      emissiveIntensity={0}
      onBeforeCompile={configureOptics}
      customProgramCacheKey={() =>
        optical ? `optical-alpha-v1:${approximation}` : "surface-v1"
      }
      name={`surface:${surface}`}
    />
  );
}
