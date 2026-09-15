import { lazy, Suspense, useRef, useState } from "react";
import { acts, story } from "./data/story";
import { goToAct, useStory } from "./hooks/useStory";
import Overlay from "./sections/Overlay";
import LaunchDialog from "./components/LaunchDialog";
import Fallback from "./experience/Fallback";
const Experience = lazy(() => import("./experience/Experience"));
export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const { active, reduced } = useStory(root);
  const [launch, setLaunch] = useState(false);
  return (
    <div
      className={`app ${reduced ? "reduced-motion" : ""}`}
      ref={root}
      data-act={active}
      onPointerMove={(e) => {
        story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        story.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      }}
      onPointerLeave={() => {
        story.pointer.x = 0;
        story.pointer.y = 0;
      }}
    >
      <a className="skip-link" href="#launch">
        Skip to launch information
      </a>
      <header className="instrument-header">
        <button
          className="wordmark"
          aria-label="First Brew — return to the object"
          onClick={() => goToAct(0)}
        >
          first brew
          <span className="logo-mark" aria-hidden="true">
            ↘
          </span>
        </button>
        <span className="header-status mono">
          <span className="status-dot" />
          PROTOTYPE 01<span className="header-divider">/</span>IN DEVELOPMENT
        </span>
        <button className="header-index mono" onClick={() => goToAct(6)}>
          LAUNCH NOTES <span>↗</span>
        </button>
      </header>
      <div className="hero-wordmark" aria-hidden="true">
        FIRST BREW<span>01</span>
      </div>
      <div
        className="scene-shell"
        role="img"
        aria-label="Concept model of First Brew. Scrolling reveals its components and a moving nozzle pouring into a standard V60."
      >
        <Suspense fallback={<Fallback loading />}>
          <Experience reduced={reduced} />
        </Suspense>
      </div>
      <div className="technical-grid" aria-hidden="true" />
      <Overlay onLaunch={() => setLaunch(true)} />
      <nav className="act-navigation" aria-label="Explore the machine">
        {acts.map((act, i) => (
          <button
            key={act.id}
            className={active === i ? "selected" : ""}
            aria-label={`Act ${i + 1}: ${act.label}`}
            aria-current={active === i ? "step" : undefined}
            onClick={() => goToAct(i)}
          >
            <span className="nav-label mono">{act.label}</span>
            <span className="nav-mark" />
          </button>
        ))}
      </nav>
      <div className="viewport-footer mono" aria-hidden="true">
        <span>FB–01</span>
        <span>
          {String(active + 1).padStart(2, "0")} /{" "}
          {acts[active].label.toUpperCase()}
        </span>
        <span>
          {reduced ? "REDUCED MOTION" : "SCROLL TO DISCOVER"} <i>↓</i>
        </span>
      </div>
      <div className="scroll-progress" aria-hidden="true" />
      <LaunchDialog open={launch} onClose={() => setLaunch(false)} />
    </div>
  );
}
