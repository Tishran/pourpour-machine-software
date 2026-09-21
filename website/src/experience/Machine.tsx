import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Html, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Finish, SurfaceProvider } from "./Materials";
import { Dripper, Carafe } from "./Vessels";
import { scaleBoxUVs, type SurfaceType } from "./materialPresets";
import { useRenderQuality } from "./RenderingQuality";
import { CENTER_Z, BED_Y, reservoirProfile } from "./vesselGeometry";
import {
  brewAt,
  nozzlePose,
  trajectory,
  brewProgress,
  clamp,
  keyframe,
  scanAt,
  story,
  type Part,
} from "../data/story";
import { copyFor, type Language } from "../i18n";

const COPPER = "#b87542";

function Block({
  position,
  size,
  color,
  surface = "powderCoat",
  axial = false,
  part,
  radius = 0.035,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  surface?: SurfaceType;
  axial?: boolean;
  part?: Part;
  radius?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    if (mesh.current) scaleBoxUVs(mesh.current.geometry, size);
  }, [size]);
  return (
    <RoundedBox
      ref={mesh}
      args={size}
      radius={radius}
      smoothness={3}
      position={position}
      castShadow
      receiveShadow
    >
      <Finish surface={surface} color={color} axial={axial} part={part} />
    </RoundedBox>
  );
}

function Inscription({
  text,
  position,
  width = 0.5,
  height = 0.09,
  color = "#252723",
  background = "transparent",
  rotation = [0, 0, 0],
}: {
  text: string;
  position: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  background?: string;
  rotation?: [number, number, number];
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 160;
    const ctx = c.getContext("2d")!;
    if (background !== "transparent") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 1024, 160);
    }
    ctx.fillStyle = color;
    ctx.font = "600 112px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 80, 980);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text, color, background]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Annotation({
  position,
  children,
  side = "right",
}: {
  position: [number, number, number];
  children: ReactNode;
  side?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (ref.current) {
      const visible = story.stage > 2.67 && story.stage < 3.72;
      ref.current.style.opacity = visible ? "1" : "0";
      ref.current.style.visibility = visible ? "visible" : "hidden";
    }
  });
  return (
    <Html
      position={position}
      center
      zIndexRange={[4, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div ref={ref} className={`component-label label-${side}`}>
        <i />
        <span>{children}</span>
      </div>
    </Html>
  );
}

export function MachineBase({ language = "en" }: { language?: Language }) {
  const copy = copyFor(language);
  return (
    <group>
      <Block position={[0, 0.17, 0]} size={[2.55, 0.25, 2.03]} radius={0.08} />
      <Block
        position={[0, 0.055, 0]}
        size={[2.35, 0.1, 1.83]}
        surface="rubber"
      />
      {[-0.9, 0.9].flatMap((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.005, z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
            <Finish surface="rubber" uvScale={[0.63, 0.08]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.31, CENTER_Z]} receiveShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.045, 64]} />
        <Finish surface="brushedSteel" uvScale={[1.3, 1.3]} part="scale" />
      </mesh>
      <mesh position={[0, 0.339, CENTER_Z]}>
        <cylinderGeometry args={[0.55, 0.55, 0.012, 64]} />
        <Finish
          surface="rubber"
          color="#383a34"
          uvScale={[1.1, 1.1]}
          part="scale"
        />
      </mesh>
      <Inscription
        text="FIRST BREW"
        position={[0, 0.17, 1.021]}
        width={0.9}
        height={0.07}
      />
      <Annotation position={[-0.7, 0.3, 0.9]} side="left">
        {copy.brewScale}
      </Annotation>
    </group>
  );
}

export function Column({ language = "en" }: { language?: Language }) {
  const copy = copyFor(language);
  return (
    <group>
      <Block
        position={[0.87, 1.9, -0.61]}
        size={[0.62, 3.2, 0.63]}
        radius={0.07}
      />
      <Block
        position={[0.53, 1.86, -0.58]}
        size={[0.08, 2.75, 0.41]}
        surface="brushedSteel"
        axial
      />
      <Block
        position={[0.865, 2.75, -0.28]}
        size={[0.39, 0.45, 0.025]}
        surface="abs"
        part="heater"
      />
      <Inscription
        text="92°C"
        position={[0.865, 2.78, -0.26]}
        width={0.28}
        height={0.09}
        color="#e9c094"
      />
      <Inscription
        text="HEAT / READY"
        position={[0.865, 2.64, -0.26]}
        width={0.27}
        height={0.045}
        color="#aaa995"
      />
      <Annotation position={[1.05, 2.3, -0.2]}>{copy.heater}</Annotation>
    </group>
  );
}

export function Arm({ language = "en" }: { language?: Language }) {
  const copy = copyFor(language);
  return (
    <group>
      <Block
        position={[0, 3.51, -0.07]}
        size={[2.44, 0.44, 1.42]}
        radius={0.07}
      />
      <Block
        position={[0, 3.268, 0.03]}
        size={[2.13, 0.065, 1.06]}
        surface="abs"
      />
      <Inscription
        text="first brew"
        position={[-0.56, 3.52, 0.648]}
        width={0.72}
        height={0.11}
      />
      <Inscription
        text="PROTOTYPE 01"
        position={[0.69, 3.52, 0.648]}
        width={0.43}
        height={0.06}
      />
      <mesh position={[0.985, 3.52, 0.654]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.029, 0.029, 0.01, 16]} />
        <meshStandardMaterial
          color={COPPER}
          emissive={COPPER}
          emissiveIntensity={0.4}
        />
      </mesh>
      {[-0.28, 0.55].map((z) => (
        <mesh key={z} position={[0, 3.2, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 2.08, 24]} />
          <Finish surface="brushedSteel" axial uvScale={[0.157, 2.08]} />
        </mesh>
      ))}
      <Annotation position={[1, 3.32, 0.5]}>{copy.flowControl}</Annotation>
    </group>
  );
}

export function Nozzle({ language = "en" }: { language?: Language }) {
  const copy = copyFor(language);
  return (
    <group>
      <Block
        position={[0, 0.08, 0]}
        size={[0.27, 0.14, 0.72]}
        surface="abs"
        part="nozzle"
      />
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 24]} />
        <Finish surface="machinedSteel" uvScale={[0.63, 0.25]} part="nozzle" />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.082, 0.038, 0.08, 24]} />
        <Finish surface="copper" uvScale={[0.4, 0.08]} part="nozzle" />
      </mesh>
      <mesh position={[0, -0.286, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.025, 16]} />
        <Finish surface="polishedSteel" uvScale={[0.15, 0.025]} />
      </mesh>
      <Inscription
        text="NOZZLE"
        position={[0, -0.08, 0.102]}
        width={0.16}
        height={0.035}
      />
      <Annotation position={[0.18, -0.18, 0.03]}>
        {copy.movingNozzle}
      </Annotation>
    </group>
  );
}

export function Reservoir({ language = "en" }: { language?: Language }) {
  const copy = copyFor(language);
  return (
    <group>
      <mesh position={[-0.76, 1.87, -0.65]}>
        <latheGeometry args={[reservoirProfile, 64]} />
        <Finish surface="acrylic" part="reservoir" />
      </mesh>
      <mesh position={[-0.76, 1.57, -0.65]}>
        <cylinderGeometry args={[0.344, 0.344, 2.1, 48]} />
        <Finish surface="water" cheap />
      </mesh>
      {[0.43, 3.3].map((y) => (
        <mesh key={y} position={[-0.76, y, -0.65]}>
          <cylinderGeometry args={[0.385, 0.385, 0.11, 48]} />
          <Finish
            surface={y > 1 ? "powderCoat" : "machinedSteel"}
            uvScale={[2.4, 0.11]}
            part="reservoir"
          />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <Block
          key={i}
          position={[-0.77, 0.8 + i * 0.22, -0.274]}
          size={[i % 3 === 0 ? 0.12 : 0.06, 0.009, 0.008]}
          surface="abs"
          color="#727a6d"
          radius={0.001}
        />
      ))}
      <Annotation position={[-1.1, 2.2, -0.65]} side="left">
        {copy.waterSystem}
      </Annotation>
    </group>
  );
}

export function WaterStream({
  head,
}: {
  head: React.RefObject<THREE.Group | null>;
}) {
  const water = useRef<THREE.Mesh>(null),
    drop = useRef<THREE.Mesh>(null),
    ripple = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!water.current || !head.current || !drop.current || !ripple.current)
      return;
    const stage = story.stage,
      brew = brewAt(brewProgress(stage));
    const active = stage >= 1.85 && stage <= 2.84 && brew.pouring;
    water.current.visible = active;
    const bottom = BED_Y + 0.015,
      top = head.current.position.y - 0.3;
    water.current.position.set(
      head.current.position.x,
      (bottom + top) / 2,
      head.current.position.z,
    );
    water.current.scale.set(1, Math.max(0, top - bottom), 1);
    drop.current.visible = stage > 1.9 && stage < 2.85;
    drop.current.position.y = story.reduced
      ? 1.2
      : 1.3 - ((clock.elapsedTime * 0.9) % 0.38);
    ripple.current.visible = active;
    ripple.current.position.set(
      head.current.position.x,
      BED_Y + 0.03,
      head.current.position.z,
    );
    ripple.current.scale.setScalar(
      story.reduced ? 0.6 : 0.45 + ((clock.elapsedTime * 1.5) % 0.55),
    );
  });
  return (
    <>
      <mesh ref={water}>
        <cylinderGeometry args={[0.008, 0.013, 1, 10]} />
        <Finish surface="water" cheap />
      </mesh>
      <mesh
        ref={drop}
        position={[0, 1.2, CENTER_Z]}
        scale={[0.012, 0.038, 0.012]}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#885a30" roughness={0.2} />
      </mesh>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.065, 0.07, 32]} />
        <meshBasicMaterial
          color="#c5b797"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

function Bag() {
  const ref = useRef<THREE.Group>(null);
  const scanLine = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      const { visibility, progress } = scanAt(story.stage);
      ref.current.visible = visibility > 0.02;
      if (scanLine.current)
        scanLine.current.position.y =
          1.5 - (story.reduced ? 0.5 : progress) * 1.4;
      ref.current.position.set(-0.7 - (1 - visibility) * 2, 0.6, 1.35);
      ref.current.rotation.y = 0.15;
    }
  });
  return (
    <group ref={ref}>
      <Block
        position={[0, 0.78, 0]}
        size={[0.8, 1.45, 0.38]}
        surface="kraftPaper"
        radius={0.05}
      />
      <Block
        position={[0, 1.53, 0]}
        size={[0.84, 0.07, 0.3]}
        surface="kraftPaper"
        color="#775738"
        radius={0.009}
      />
      <Block
        position={[0, 0.76, 0.198]}
        size={[0.61, 0.94, 0.009]}
        surface="filterPaper"
        color="#ddd8b8"
        radius={0.002}
      />
      <Inscription
        text="ETHIOPIA"
        position={[0, 1.06, 0.208]}
        width={0.5}
        height={0.09}
      />
      <Inscription
        text="GUJI"
        position={[0, 0.91, 0.208]}
        width={0.45}
        height={0.13}
      />
      <Inscription
        text="NATURAL"
        position={[0, 0.58, 0.208]}
        width={0.38}
        height={0.06}
      />
      <Inscription
        text="LIGHT ROAST / 250 G"
        position={[0, 0.43, 0.208]}
        width={0.49}
        height={0.05}
      />
      <Line
        points={[
          [-0.46, 0.06, 0.24],
          [-0.46, 1.57, 0.24],
          [0.46, 1.57, 0.24],
          [0.46, 0.06, 0.24],
          [-0.46, 0.06, 0.24],
        ]}
        color={COPPER}
        lineWidth={1}
      />
      <group ref={scanLine}>
        <Line
          points={[
            [-0.44, 0, 0.25],
            [0.44, 0, 0.25],
          ]}
          color="#e5a567"
          lineWidth={2}
        />
      </group>
      <Inscription
        text="READING THE BAG"
        position={[0, -0.04, 0.24]}
        width={0.85}
        height={0.075}
        color={COPPER}
      />
    </group>
  );
}

function WaterSystem() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.76, 0.65, -0.65),
          new THREE.Vector3(-0.76, 3.03, -0.65),
          new THREE.Vector3(-0.6, 3.13, -0.65),
          new THREE.Vector3(0.58, 3.13, -0.65),
          new THREE.Vector3(0.65, 2.45, -0.4),
          new THREE.Vector3(0.65, 2.12, -0.4),
        ],
        false,
        "centripetal",
      ),
    [],
  );
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.022, 8, false]} />
        <Finish
          surface="rubber"
          color="#343a34"
          uvScale={[3.8, 0.14]}
          part="flow"
        />
      </mesh>
      <mesh position={[0.61, 2.35, -0.35]}>
        <cylinderGeometry args={[0.12, 0.12, 0.55, 24]} />
        <Finish surface="copper" uvScale={[0.75, 0.55]} part="heater" />
      </mesh>
      <Block
        position={[0.61, 2.83, -0.36]}
        size={[0.27, 0.22, 0.26]}
        surface="abs"
        part="flow"
      />
    </group>
  );
}

function MachineModel({ language }: { language: Language }) {
  const copy = copyFor(language);
  const root = useRef<THREE.Group>(null),
    nozzle = useRef<THREE.Group>(null),
    pathGroup = useRef<THREE.Group>(null);
  const points = useMemo(
    () =>
      Array.from({ length: 150 }, (_, i) => {
        const p = trajectory(i / 149);
        return new THREE.Vector3(p.x, BED_Y + 0.032, CENTER_Z + p.z);
      }),
    [],
  );
  useFrame((_, delta) => {
    const stage = story.reduced
      ? Math.min(4, Math.floor(story.stage + 0.22))
      : story.stage;
    if (root.current) {
      const rotation = keyframe([-0.28, 0.27, 0.04, 0.18, -0.32], stage);
      const parallax = story.reduced
        ? 0
        : story.pointer.x * 0.035 * clamp(1 - stage);
      root.current.rotation.y = story.reduced
        ? rotation
        : THREE.MathUtils.damp(
            root.current.rotation.y,
            rotation + parallax,
            5,
            delta,
          );
    }
    if (nozzle.current) {
      const pose = nozzlePose(story.reduced && stage === 2 ? 2.45 : stage);
      nozzle.current.position.set(pose.x, pose.y, CENTER_Z + pose.z);
    }
    if (pathGroup.current)
      pathGroup.current.visible = stage > 1.78 && stage < 2.8;
  });
  return (
    <group ref={root}>
      <group>
        <MachineBase language={language} />
      </group>
      <Column language={language} />
      <WaterSystem />
      <group>
        <Arm language={language} />
      </group>
      <group>
        <Reservoir language={language} />
      </group>
      <group ref={nozzle} position={[0, 3.08, CENTER_Z]}>
        <Nozzle language={language} />
      </group>
      <group>
        <Dripper />
        <Annotation position={[-0.44, 1.85, CENTER_Z]} side="left">
          {copy.standardV60}
        </Annotation>
      </group>
      <group>
        <Carafe />
      </group>
      <WaterStream head={nozzle} />
      <group ref={pathGroup}>
        <Line
          points={points}
          color={COPPER}
          lineWidth={1}
          transparent
          opacity={0.47}
        />
      </group>
      <Inscription
        text="AXIS X / ±42 MM"
        position={[0, 3.22, 0.565]}
        width={0.58}
        height={0.05}
        color="#b9bbae"
      />
      <Bag />
    </group>
  );
}

export default function Machine({ language }: { language: Language }) {
  const quality = useRenderQuality();
  return (
    <SurfaceProvider>
      <MachineModel language={language} />
      <ContactShadows
        position={[0, -0.047, 0]}
        opacity={0.38}
        scale={7}
        blur={2.2}
        far={5}
        resolution={quality === "low" ? 256 : 512}
        frames={1}
      />
    </SurfaceProvider>
  );
}
