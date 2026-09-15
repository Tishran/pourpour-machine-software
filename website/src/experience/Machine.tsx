import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Html, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Finish, SurfaceProvider } from "./Materials";
import { Dripper, Carafe } from "./Vessels";
import { CENTER_Z, BED_Y } from "./vesselGeometry";
import {
  brewAt,
  brewProgress,
  clamp,
  keyframe,
  smooth,
  story,
  trajectory,
  type Part,
} from "../data/story";

const CERAMIC = "#dedbd1",
  METAL = "#a4aaa8",
  RUBBER = "#252723",
  COPPER = "#b87542";

function Block({
  position,
  size,
  color,
  metal,
  part,
  radius = 0.035,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  metal?: number;
  part?: Part;
  radius?: number;
}) {
  return (
    <RoundedBox
      args={size}
      radius={radius}
      smoothness={3}
      position={position}
      castShadow
      receiveShadow
    >
      <Finish color={color} metal={metal} part={part} />
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
      const visible = story.stage > 1.67 && story.stage < 2.72;
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

export function MachineBase() {
  return (
    <group>
      <Block position={[0, 0.17, 0]} size={[2.55, 0.25, 2.03]} radius={0.08} />
      <Block position={[0, 0.055, 0]} size={[2.35, 0.1, 1.83]} color={RUBBER} />
      {[-0.9, 0.9].flatMap((x) =>
        [-0.6, 0.6].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.005, z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
            <Finish color={RUBBER} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.31, CENTER_Z]} receiveShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.045, 64]} />
        <Finish color={METAL} metal={0.8} part="scale" />
      </mesh>
      <mesh position={[0, 0.339, CENTER_Z]}>
        <cylinderGeometry args={[0.55, 0.55, 0.012, 64]} />
        <Finish color="#383a34" part="scale" />
      </mesh>
      <Inscription
        text="FIRST BREW / FB–01"
        position={[0, 0.17, 1.021]}
        width={0.9}
        height={0.07}
      />
      <Annotation position={[-0.7, 0.3, 0.9]} side="left">
        06 / BREW SCALE
      </Annotation>
    </group>
  );
}

export function Column() {
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
        color={METAL}
        metal={0.85}
      />
      <Block
        position={[0.865, 2.75, -0.28]}
        size={[0.39, 0.45, 0.025]}
        color={RUBBER}
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
      <Annotation position={[1.05, 2.3, -0.2]}>02 / HEATER</Annotation>
    </group>
  );
}

export function Arm() {
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
        color={RUBBER}
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
          <cylinderGeometry args={[0.025, 0.025, 2.08, 16]} />
          <Finish color={METAL} metal={0.9} />
        </mesh>
      ))}
      <Annotation position={[1, 3.32, 0.5]}>03 / FLOW CONTROL</Annotation>
    </group>
  );
}

export function Nozzle() {
  return (
    <group>
      <Block
        position={[0, 0.08, 0]}
        size={[0.27, 0.14, 0.72]}
        color={RUBBER}
        part="nozzle"
      />
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 24]} />
        <Finish color={METAL} metal={0.88} rough={0.22} part="nozzle" />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.082, 0.038, 0.08, 24]} />
        <Finish color={COPPER} metal={0.7} part="nozzle" />
      </mesh>
      <mesh position={[0, -0.286, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.025, 16]} />
        <Finish color={RUBBER} />
      </mesh>
      <Inscription
        text="FB-N01"
        position={[0, -0.08, 0.102]}
        width={0.16}
        height={0.035}
      />
      <Annotation position={[0.18, -0.18, 0.03]}>04 / MOVING NOZZLE</Annotation>
    </group>
  );
}

export function Reservoir() {
  return (
    <group>
      <mesh position={[-0.76, 1.87, -0.65]}>
        <cylinderGeometry args={[0.37, 0.37, 2.8, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#a8b5a9"
          transparent
          opacity={0.24}
          roughness={0.12}
          metalness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.76, 1.57, -0.65]}>
        <cylinderGeometry args={[0.344, 0.344, 2.1, 48]} />
        <meshPhysicalMaterial
          color="#859b90"
          transparent
          opacity={0.2}
          roughness={0.08}
          depthWrite={false}
        />
      </mesh>
      {[0.43, 3.3].map((y) => (
        <mesh key={y} position={[-0.76, y, -0.65]}>
          <cylinderGeometry args={[0.385, 0.385, 0.11, 48]} />
          <Finish
            color={y > 1 ? CERAMIC : METAL}
            metal={y > 1 ? 0 : 0.7}
            part="reservoir"
          />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <Block
          key={i}
          position={[-0.77, 0.8 + i * 0.22, -0.274]}
          size={[i % 3 === 0 ? 0.12 : 0.06, 0.009, 0.008]}
          color="#727a6d"
          radius={0.001}
        />
      ))}
      <Annotation position={[-1.1, 2.2, -0.65]} side="left">
        01 / WATER SYSTEM
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
    const active = stage >= 3.85 && stage <= 4.84 && brew.pouring;
    water.current.visible = active;
    const bottom = BED_Y + 0.015,
      top = head.current.position.y - 0.3;
    water.current.position.set(
      head.current.position.x,
      (bottom + top) / 2,
      head.current.position.z,
    );
    water.current.scale.set(1, Math.max(0, top - bottom), 1);
    drop.current.visible = stage > 3.9 && stage < 5.1;
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
        <meshStandardMaterial
          color="#d7e9e1"
          transparent
          opacity={0.76}
          roughness={0.12}
          emissive="#a4bcbb"
          emissiveIntensity={0.3}
        />
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
  const frame = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (ref.current) {
      const visibility =
        smooth((story.stage - 2.72) / 0.28) *
        (1 - smooth((story.stage - 3.55) / 0.25));
      ref.current.visible = visibility > 0.02;
      if (frame.current) {
        frame.current.style.setProperty(
          "--scan-progress",
          String(story.reduced ? 0.5 : clamp((story.stage - 2.9) / 0.62)),
        );
        frame.current.style.opacity = String(visibility);
        frame.current.style.visibility =
          visibility > 0.02 ? "visible" : "hidden";
      }
      ref.current.position.set(-0.7 - (1 - visibility) * 2, 0.6, 1.35);
      ref.current.rotation.y = 0.15;
    }
  });
  return (
    <group ref={ref}>
      <Block
        position={[0, 0.78, 0]}
        size={[0.8, 1.45, 0.38]}
        color="#997656"
        radius={0.05}
      />
      <Block
        position={[0, 1.53, 0]}
        size={[0.84, 0.07, 0.3]}
        color="#775738"
        radius={0.009}
      />
      <Block
        position={[0, 0.76, 0.198]}
        size={[0.61, 0.94, 0.009]}
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
      <Html
        position={[0, 0.8, 0.23]}
        center
        transform
        distanceFactor={3}
        zIndexRange={[3, 0]}
      >
        <div ref={frame} className="scan-frame">
          <span className="scan-line" />
          <span className="scan-caption">READING THE BAG</span>
        </div>
      </Html>
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
        <Finish color="#343a34" rough={0.65} part="flow" />
      </mesh>
      <mesh position={[0.61, 2.35, -0.35]}>
        <cylinderGeometry args={[0.12, 0.12, 0.55, 24]} />
        <Finish color={COPPER} metal={0.75} part="heater" />
      </mesh>
      <Block
        position={[0.61, 2.83, -0.36]}
        size={[0.27, 0.22, 0.26]}
        color={RUBBER}
        part="flow"
      />
    </group>
  );
}

function MachineModel({ mobile }: { mobile: boolean }) {
  const root = useRef<THREE.Group>(null),
    base = useRef<THREE.Group>(null),
    arm = useRef<THREE.Group>(null),
    nozzle = useRef<THREE.Group>(null),
    reservoir = useRef<THREE.Group>(null),
    dripper = useRef<THREE.Group>(null),
    carafe = useRef<THREE.Group>(null),
    pathGroup = useRef<THREE.Group>(null),
    waterPath = useRef<THREE.Group>(null);
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
      ? Math.min(6, Math.floor(story.stage + 0.22))
      : story.stage;
    const explode =
      keyframe([0, 0, 1, 0, 0, 0, 0], stage) * (mobile ? 0.65 : 1);
    if (root.current) {
      const rotation = keyframe(
        [-0.28, 0.27, 0.18, -0.22, 0.04, 0.04, -0.32],
        stage,
      );
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
    if (base.current) base.current.position.y = -explode * 0.45;
    if (carafe.current) carafe.current.position.y = -explode * 0.45;
    if (arm.current) arm.current.position.y = explode * 0.38;
    if (reservoir.current) reservoir.current.position.x = -explode * 0.72;
    if (dripper.current) dripper.current.position.y = -explode * 0.22;
    if (nozzle.current) {
      const brew = brewAt(brewProgress(story.reduced ? 4.45 : stage));
      const active = stage > 3.8 && stage < 5.8;
      nozzle.current.position.set(
        active ? brew.x : 0,
        3.08 + explode * 1.4,
        CENTER_Z + (active ? brew.z : 0),
      );
    }
    if (pathGroup.current)
      pathGroup.current.visible = stage > 3.78 && stage < 5.8;
    if (waterPath.current) waterPath.current.visible = explode > 0.2;
  });
  return (
    <group ref={root}>
      <group ref={base}>
        <MachineBase />
      </group>
      <Column />
      <WaterSystem />
      <group ref={arm}>
        <Arm />
      </group>
      <group ref={reservoir}>
        <Reservoir />
      </group>
      <group ref={nozzle} position={[0, 3.08, CENTER_Z]}>
        <Nozzle />
      </group>
      <group ref={dripper}>
        <Dripper />
        <Annotation position={[-0.44, 1.85, CENTER_Z]} side="left">
          05 / STANDARD V60
        </Annotation>
      </group>
      <group ref={carafe}>
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
      <group ref={waterPath}>
        <Line
          points={[
            [-1.42, 1.7, -0.65],
            [-1.42, 3.25, -0.65],
            [0.8, 3.25, -0.65],
            [0.8, 3.7, 0.3],
            [0, 3.7, 0.3],
            [0, 3.5, 0.3],
          ]}
          color={COPPER}
          lineWidth={1.4}
          dashed
          dashSize={0.07}
          gapSize={0.04}
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

export default function Machine({ mobile }: { mobile: boolean }) {
  return (
    <SurfaceProvider>
      <MachineModel mobile={mobile} />
      <ContactShadows
        position={[0, -0.09, 0]}
        opacity={0.3}
        scale={7}
        blur={2.5}
        far={5}
        resolution={256}
        frames={1}
      />
    </SurfaceProvider>
  );
}
