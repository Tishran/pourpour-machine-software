import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { acts, story } from "./data/story";
import { goToAct, useStory } from "./hooks/useStory";
import Overlay from "./sections/Overlay";
import LaunchDialog from "./components/LaunchDialog";
import Fallback from "./experience/Fallback";
import { copyFor, LANGUAGE_KEY, type Language } from "./i18n";
const Experience = lazy(() => import("./experience/Experience"));
export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ru";
    } catch {
      return "ru";
    }
  });
  const copy = copyFor(language);
  const { active, reduced } = useStory(root, language);
  const [launch, setLaunch] = useState(false);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = copy.metaTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.metaDescription);
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // The selected language still works when browser storage is unavailable.
    }
  }, [copy.metaDescription, copy.metaTitle, language]);
  return (
    <div
      className={`app ${reduced ? "reduced-motion" : ""}`}
      ref={root}
      data-act={active}
      data-scene={acts[active].id}
      onPointerMove={(e) => {
        story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        story.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      }}
      onPointerLeave={() => {
        story.pointer.x = 0;
        story.pointer.y = 0;
      }}
    >
      <a className="skip-link" href="#preorder">
        {copy.skip}
      </a>
      <header className="instrument-header">
        <button
          className="wordmark"
          aria-label={copy.returnObject}
          onClick={() => goToAct(0)}
        >
          first brew
          <span className="logo-mark" aria-hidden="true">
            ↘
          </span>
        </button>
        <div className="header-actions">
          <div
            className="language-switcher mono"
            role="group"
            aria-label={copy.language}
          >
            {(["ru", "en"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={language === value}
                onClick={() => setLanguage(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="header-index mono"
            onClick={() => goToAct(acts.length - 1)}
          >
            {copy.launchNotes} <span>↗</span>
          </button>
        </div>
      </header>
      <div className="scene-shell" role="img" aria-label={copy.sceneLabel}>
        <Suspense fallback={<Fallback loading language={language} />}>
          <Experience reduced={reduced} language={language} />
        </Suspense>
      </div>
      <div className="technical-grid" aria-hidden="true" />
      <Overlay language={language} onLaunch={() => setLaunch(true)} />
      <nav className="act-navigation" aria-label={copy.explore}>
        {acts.map((act, i) => (
          <button
            key={act.id}
            className={active === i ? "selected" : ""}
            aria-label={`${copy.act} ${i + 1}: ${copy.acts[act.id]}`}
            aria-current={active === i ? "step" : undefined}
            onClick={() => goToAct(i)}
          >
            <span className="nav-label mono">{copy.acts[act.id]}</span>
            <span className="nav-mark" />
          </button>
        ))}
      </nav>
      <div className="scroll-progress" aria-hidden="true" />
      <LaunchDialog
        language={language}
        open={launch}
        onClose={() => setLaunch(false)}
      />
    </div>
  );
}
