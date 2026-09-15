import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import Machine from "./Machine";
import Fallback from "./Fallback";
import { keyframe, story } from "../data/story";

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

function Stage({ reduced }: { reduced: boolean }) {
  const { size, camera, invalidate } = useThree();
  const mobile = size.width < 620;
  const target = useMemoVector();
  const key = useRef<THREE.SpotLight>(null),
    fill = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    if (!reduced) return;
    const update = () => invalidate();
    window.addEventListener("firstbrew:frame", update);
    window.addEventListener("pointermove", update, { passive: true });
    return () => {
      window.removeEventListener("firstbrew:frame", update);
      window.removeEventListener("pointermove", update);
    };
  }, [reduced, invalidate]);
  useFrame((_, delta) => {
    const s = reduced
      ? Math.min(6, Math.floor(story.stage + 0.22))
      : story.stage;
    const x =
      keyframe([4.7, 4.1, 5, 4.7, 1.6, 1.6, 4.7], s) * (mobile ? 0.84 : 1);
    const y = keyframe([3.1, 4.2, 4.6, 3.8, 4.1, 4.1, 3.4], s);
    const z =
      keyframe([7.8, 6.1, 8.2, 7.7, 3.25, 3.25, 8.1], s) * (mobile ? 1.12 : 1);
    if (reduced) camera.position.set(x, y, z);
    else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 7, delta);
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        y + story.pointer.y * 0.025,
        7,
        delta,
      );
      camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 7, delta);
    }
    target.set(0, keyframe([1.8, 2.0, 2.06, 1.8, 2.1, 2.1, 1.82], s), 0.05);
    camera.lookAt(target);
    if (key.current) key.current.intensity = 85 + story.light * 35;
    if (fill.current) fill.current.intensity = 0.6 + story.light * 1.2;
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight
        ref={key}
        position={[-3, 7, 5]}
        angle={0.52}
        penumbra={0.6}
        intensity={100}
        color="#fff0dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight
        ref={fill}
        position={[4, 3, 2]}
        intensity={0.8}
        color="#d6e0df"
      />
      <spotLight
        position={[2, 5, -4]}
        intensity={130}
        color="#dfb18a"
        angle={0.8}
        penumbra={0.65}
      />
      <Environment resolution={128} frames={1}>
        <Lightformer
          intensity={3}
          position={[-4, 4, 3]}
          scale={[3, 7, 1]}
          rotation={[0, Math.PI / 3, 0]}
        />
        <Lightformer
          intensity={2}
          position={[4, 3, -2]}
          scale={[2, 5, 1]}
          rotation={[0, -Math.PI / 3, 0]}
        />
        <Lightformer
          intensity={1.5}
          position={[0, 7, 0]}
          scale={[6, 3, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </Environment>
      <Suspense fallback={null}>
        <Machine mobile={mobile} />
      </Suspense>
      <AdaptiveDpr pixelated />
    </>
  );
}
function useMemoVector() {
  const ref = useRef(new THREE.Vector3());
  return ref.current;
}

export default function Experience({ reduced }: { reduced: boolean }) {
  const [lost, setLost] = useState(false);
  return (
    <SceneBoundary>
      {lost ? (
        <Fallback />
      ) : (
        <Canvas
          shadows
          dpr={[1, 1.5]}
          frameloop={reduced ? "demand" : "always"}
          camera={{ position: [4.7, 3.1, 7.8], fov: 36, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          fallback={<Fallback />}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => setLost(true),
              { once: true },
            );
          }}
        >
          <Stage reduced={reduced} />
        </Canvas>
      )}
    </SceneBoundary>
  );
}
