import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { story, type Part } from "../data/story";

type SurfaceMaps = {
  metalNormal: THREE.Texture;
  metalRoughness: THREE.Texture;
  grainNormal: THREE.Texture;
  grainRoughness: THREE.Texture;
  paperColor: THREE.Texture;
  paperNormal: THREE.Texture;
};
const Surfaces = createContext<SurfaceMaps | null>(null);

export function SurfaceProvider({ children }: { children: ReactNode }) {
  const loaded = useTexture({
    metalNormal: "/textures/brushed-metal-normal.jpg",
    metalRoughness: "/textures/brushed-metal-roughness.jpg",
    grainNormal: "/textures/surface-grain-normal.jpg",
    grainRoughness: "/textures/surface-grain-roughness.jpg",
    paperColor: "/textures/filter-paper-color.jpg",
    paperNormal: "/textures/filter-paper-normal.jpg",
  });
  const maps = useMemo(() => {
    for (const [name, texture] of Object.entries(loaded)) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      texture.colorSpace =
        name === "paperColor" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.repeat.set(
        name.startsWith("metal") ? 3 : 2,
        name.startsWith("metal") ? 5 : 2,
      );
      texture.needsUpdate = true;
    }
    return loaded;
  }, [loaded]);
  return <Surfaces.Provider value={maps}>{children}</Surfaces.Provider>;
}

export function useSurfaceMaps() {
  const maps = useContext(Surfaces);
  if (!maps) throw new Error("Surface materials need SurfaceProvider");
  return maps;
}

export function Finish({
  color = "#dedbd1",
  metal = 0,
  rough = 0.35,
  part,
}: {
  color?: string;
  metal?: number;
  rough?: number;
  part?: Part;
}) {
  const ref = useRef<THREE.MeshPhysicalMaterial>(null);
  const maps = useSurfaceMaps();
  const metallic = metal > 0.5;
  useFrame((_, delta) => {
    if (ref.current)
      ref.current.emissiveIntensity = THREE.MathUtils.damp(
        ref.current.emissiveIntensity,
        part && story.highlight === part ? 0.6 : 0,
        10,
        delta,
      );
  });
  return (
    <meshPhysicalMaterial
      ref={ref}
      color={color}
      roughness={metallic ? Math.max(0.58, rough) : 0.8}
      metalness={metal}
      normalMap={metallic ? maps.metalNormal : maps.grainNormal}
      normalScale={metallic ? [0.2, 0.2] : [0.055, 0.055]}
      roughnessMap={metallic ? maps.metalRoughness : maps.grainRoughness}
      clearcoat={metallic ? 0 : 0.24}
      clearcoatRoughness={0.3}
      emissive="#b87542"
      emissiveIntensity={0}
    />
  );
}

export function Glass({ handle = false }: { handle?: boolean }) {
  return (
    <meshPhysicalMaterial
      color="#ecf3ee"
      transparent
      opacity={handle ? 0.5 : 0.24}
      roughness={0.055}
      metalness={0}
      envMapIntensity={1.35}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}
