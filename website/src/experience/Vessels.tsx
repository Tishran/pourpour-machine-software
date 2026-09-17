import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { brewAt, brewProgress, clamp, story } from "../data/story";
import { Finish } from "./Materials";
import {
  BED_RADIUS,
  BED_Y,
  CARAFE_BOTTOM,
  CENTER_Z,
  carafeHandleCurve,
  carafeProfile,
  dripperHandleCurve,
  dripperProfile,
  filterGeometry,
} from "./vesselGeometry";

function CoffeeBed() {
  const grains = useRef<THREE.InstancedMesh>(null);
  const grainFinish = useRef<THREE.MeshStandardMaterial>(null);
  const bedFinish = useRef<THREE.MeshStandardMaterial>(null);
  const dryBed = useMemo(() => new THREE.Color("#342217"), []);
  const wetBed = useMemo(() => new THREE.Color("#21130e"), []);
  useFrame(() => {
    const wet = clamp(brewAt(brewProgress(story.stage)).volume / 75);
    if (grainFinish.current) {
      grainFinish.current.roughness = 0.94 - wet * 0.23;
      grainFinish.current.color.setScalar(1 - wet * 0.22);
    }
    if (bedFinish.current) {
      bedFinish.current.color.copy(dryBed).lerp(wetBed, wet);
      bedFinish.current.roughness = 0.95 - wet * 0.22;
    }
  });
  useEffect(() => {
    if (!grains.current) return;
    const dummy = new THREE.Object3D();
    const shades = ["#50321f", "#382318", "#61412a", "#452919", "#2c1b13"].map(
      (c) => new THREE.Color(c),
    );
    for (let i = 0; i < 850; i++) {
      const r = Math.sqrt((i + 0.5) / 850) * (BED_RADIUS - 0.008),
        a = i * 2.399963;
      dummy.position.set(
        Math.cos(a) * r,
        0.007 + Math.sin(i * 47.2) * 0.004,
        Math.sin(a) * r,
      );
      dummy.rotation.set(i, i * 0.7, i * 0.2);
      const scale = 0.6 + (Math.sin(i * 3.7) + 1) * 0.3;
      dummy.scale.set(
        scale * (0.85 + 0.2 * Math.cos(i)),
        scale * 0.65,
        scale * (1.05 + 0.15 * Math.sin(i)),
      );
      dummy.updateMatrix();
      grains.current.setMatrixAt(i, dummy.matrix);
      grains.current.setColorAt(i, shades[i % shades.length]);
    }
    grains.current.instanceMatrix.needsUpdate = true;
    if (grains.current.instanceColor)
      grains.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <group position={[0, BED_Y, CENTER_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[BED_RADIUS, 64]} />
        <meshStandardMaterial
          ref={bedFinish}
          color="#342217"
          roughness={0.95}
        />
      </mesh>
      <instancedMesh ref={grains} args={[undefined, undefined, 850]}>
        <icosahedronGeometry args={[0.012, 0]} />
        <meshStandardMaterial ref={grainFinish} roughness={0.94} />
      </instancedMesh>
    </group>
  );
}

function PaperFilter() {
  const geometry = useMemo(filterGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const seam = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.046, 1.51, -0.055),
        new THREE.Vector3(-0.16, 1.78, -0.19),
        new THREE.Vector3(-0.31, 2.16, -0.379),
      ]),
    [],
  );
  return (
    <group position={[0, 0, CENTER_Z]}>
      <mesh geometry={geometry}>
        <Finish surface="filterPaper" uvScale={[3.1, 0.68]} />
      </mesh>
      <mesh>
        <tubeGeometry args={[seam, 20, 0.005, 5, false]} />
        <meshStandardMaterial color="#c8b58e" roughness={1} />
      </mesh>
    </group>
  );
}

export function Dripper() {
  const handle = useMemo(dripperHandleCurve, []);
  const ribs = useMemo(
    () =>
      Array.from(
        { length: 24 },
        (_, i) =>
          new THREE.CatmullRomCurve3(
            Array.from({ length: 8 }, (_, j) => {
              const t = j / 7,
                y = 1.475 + t * 0.552,
                r = 0.158 + t * 0.355,
                angle = (i * Math.PI) / 12 + t * 0.1;
              return new THREE.Vector3(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r,
              );
            }),
          ),
      ),
    [],
  );
  const foot = useMemo(
    () =>
      [
        [0.084, 1.36],
        [0.33, 1.36],
        [0.34, 1.38],
        [0.33, 1.4],
        [0.084, 1.4],
        [0.084, 1.36],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
    [],
  );
  return (
    <group>
      <group position={[0, 0, CENTER_Z]}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[dripperProfile, 96]} />
          <Finish surface="ceramic" uvScale={[3.2, 0.7]} part="dripper" />
        </mesh>
        {ribs.map((curve, i) => (
          <mesh key={i}>
            <tubeGeometry args={[curve, 12, 0.008, 6, false]} />
            <Finish surface="ceramic" uvScale={[3.2, 0.7]} part="dripper" />
          </mesh>
        ))}
        <mesh castShadow>
          <tubeGeometry args={[handle, 48, 0.038, 12, false]} />
          <Finish surface="ceramic" uvScale={[3.2, 0.7]} part="dripper" />
        </mesh>
        {[
          [0.475, 1.99, 0],
          [0.313, 1.72, 0],
        ].map((p, i) => (
          <mesh
            key={i}
            position={p as [number, number, number]}
            scale={[0.055, 0.047, 0.043]}
          >
            <sphereGeometry args={[1, 16, 12]} />
            <Finish surface="ceramic" uvScale={[3.2, 0.7]} part="dripper" />
          </mesh>
        ))}
        <mesh>
          <latheGeometry args={[foot, 64]} />
          <Finish surface="ceramic" uvScale={[3.2, 0.7]} part="dripper" />
        </mesh>
      </group>
      <PaperFilter />
      <CoffeeBed />
    </group>
  );
}

export function Carafe() {
  const liquid = useRef<THREE.Mesh>(null),
    meniscus = useRef<THREE.Mesh>(null);
  const handle = useMemo(carafeHandleCurve, []);
  useFrame(() => {
    if (!liquid.current || !meniscus.current) return;
    const amount = clamp(brewAt(brewProgress(story.stage)).volume / 300),
      height = Math.max(0.002, amount * 0.32);
    liquid.current.visible = meniscus.current.visible = amount > 0.001;
    liquid.current.scale.y = height;
    liquid.current.position.y = 0.412 + height / 2;
    meniscus.current.position.y = 0.412 + height + 0.001;
  });
  return (
    <group>
      <mesh position={[0, CARAFE_BOTTOM, CENTER_Z]} renderOrder={2}>
        <latheGeometry args={[carafeProfile, 96]} />
        <Finish surface="glass" />
      </mesh>
      <mesh position={[0, 0, CENTER_Z]} renderOrder={3}>
        <tubeGeometry args={[handle, 48, 0.039, 12, false]} />
        <Finish surface="glass" thickness={0.055} cheap />
      </mesh>
      {[
        [0.305, 1.14, CENTER_Z],
        [0.483, 0.62, CENTER_Z],
      ].map((p, i) => (
        <mesh
          key={i}
          position={p as [number, number, number]}
          scale={[0.051, 0.047, 0.043]}
          renderOrder={3}
        >
          <sphereGeometry args={[1, 16, 12]} />
          <Finish surface="glass" thickness={0.055} cheap />
        </mesh>
      ))}
      <mesh ref={liquid} position={[0, 0.412, CENTER_Z]}>
        <cylinderGeometry args={[0.43, 0.415, 1, 64]} />
        <meshStandardMaterial color="#422014" roughness={0.22} metalness={0} />
      </mesh>
      <mesh
        ref={meniscus}
        position={[0, 0.412, CENTER_Z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.423, 0.43, 64]} />
        <meshStandardMaterial color="#86502c" roughness={0.16} />
      </mesh>
    </group>
  );
}
