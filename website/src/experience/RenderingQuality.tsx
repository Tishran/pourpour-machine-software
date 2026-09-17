import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { story } from "../data/story";

export type Quality = "high" | "medium" | "low";
export const qualitySettings = {
  high: {
    dpr: 1.5,
    transmissionScale: 0.75,
    shadowSize: 1024,
    environmentSize: 256,
  },
  medium: {
    dpr: 1.25,
    transmissionScale: 0.5,
    shadowSize: 1024,
    environmentSize: 256,
  },
  low: {
    dpr: 1,
    transmissionScale: 0.25,
    shadowSize: 512,
    environmentSize: 128,
  },
} as const;

const QualityContext = createContext<Quality>("high");
export const useRenderQuality = () => useContext(QualityContext);

export function RenderingQuality({ children }: { children: ReactNode }) {
  const { gl, size, setDpr, invalidate } = useThree();
  const [requested] = useState<Quality | null>(() => {
    const q = new URLSearchParams(window.location.search).get("quality");
    return q === "high" || q === "medium" || q === "low" ? q : null;
  });
  const [adaptive, setAdaptive] = useState<Quality>("high");
  const mobile = size.width < 620;
  const quality = requested ?? (mobile ? "low" : adaptive);
  const sample = useRef({ frames: 0, time: 0, warmup: 3 });
  useLayoutEffect(() => {
    const settings = qualitySettings[quality];
    setDpr(Math.min(window.devicePixelRatio || 1, settings.dpr));
    gl.transmissionResolutionScale = settings.transmissionScale;
    gl.domElement.dataset.quality = quality;
    sample.current = { frames: 0, time: 0, warmup: 3 };
    invalidate();
  }, [gl, invalidate, quality, setDpr, size.width, size.height]);
  useFrame((state, delta) => {
    // Canvas can reconfigure its DPR when an unrelated React UI update occurs.
    // Reassert the cap before drawing, including in demand-rendered mode.
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      qualitySettings[quality].dpr,
    );
    if (state.viewport.dpr !== dpr) setDpr(dpr);
    if (
      requested ||
      mobile ||
      story.reduced ||
      document.hidden ||
      quality === "low"
    )
      return;
    const s = sample.current;
    // Ignore shader warmup, tab restoration and paused demand-rendered frames.
    if (delta > 1) {
      s.frames = s.time = 0;
      return;
    }
    if (s.warmup > 0) {
      s.warmup -= delta;
      return;
    }
    s.frames++;
    s.time += delta;
    if (s.time < 5) return;
    const fps = s.frames / s.time;
    if (fps < (quality === "high" ? 48 : 36)) {
      setAdaptive(quality === "high" ? "medium" : "low");
    }
    s.frames = s.time = 0;
  });
  return (
    <QualityContext.Provider value={quality}>
      {children}
    </QualityContext.Provider>
  );
}
