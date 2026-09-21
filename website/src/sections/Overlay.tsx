import { acts } from "../data/story";
import MagneticButton from "../components/MagneticButton";
import PreorderSection from "./PreorderSection";
import DevelopmentSection from "./DevelopmentSection";
import { copyFor, phaseFor, type Language } from "../i18n";

export default function Overlay({
  language,
  onLaunch,
}: {
  language: Language;
  onLaunch: () => void;
}) {
  const copy = copyFor(language);
  return (
    <main className="story" id="story">
      {acts.map((act, i) => (
        <section
          className={`act act-${act.id}`}
          id={act.id}
          key={act.id}
          aria-label={`${i + 1}. ${copy.acts[act.id]}`}
        >
          <div className={`act-panel panel-${act.id}`}>
            {act.id === "object" && (
              <>
                <div className="hero-copy">
                  <p className="eyebrow">
                    <span className="status-dot" />
                    {copy.heroEyebrow}
                  </p>
                  <h1>
                    {copy.heroTitle}
                    <br />
                    <em>{copy.heroEmphasis}</em>
                  </h1>
                  <p className="body-copy">{copy.heroBody}</p>
                </div>
                <div className="hero-index mono">
                  01—05 <span>{copy.scrollExplore}</span>
                  <i />
                </div>
              </>
            )}
            {act.id === "engineering" && (
              <div className="editorial">
                <p className="eyebrow">{copy.engineeringEyebrow}</p>
                <h2>
                  {copy.engineeringTitle}
                  <br />
                  <em>{copy.engineeringEmphasis}</em>
                </h2>
                <p className="body-copy">{copy.engineeringBody}</p>
                <div className="engineering-legend mono">
                  <span>{copy.componentStudy}</span>
                  <span>{copy.componentDetail}</span>
                  <span>{copy.conceptGeometry}</span>
                </div>
              </div>
            )}
            {act.id === "brew" && (
              <>
                <div className="editorial brew-editorial">
                  <p className="eyebrow">{copy.brewEyebrow}</p>
                  <h2>
                    {copy.brewTitle}
                    <br />
                    <em>{copy.brewEmphasis}</em>
                  </h2>
                  <p className="body-copy">{copy.brewBody}</p>
                  <span className="brew-phase mono" id="brew-phase">
                    {phaseFor(language, "01 / CENTER POUR")}
                  </span>
                  <div className="brew-instruction mono">
                    <span>↓</span> {copy.brewInstruction}
                  </div>
                  <div className="brew-hud">
                    <div>
                      <span>{copy.brewTime}</span>
                      <strong id="brew-timer">00:00</strong>
                    </div>
                    <div>
                      <span>{copy.temperature}</span>
                      <strong>
                        92<small> °C</small>
                      </strong>
                    </div>
                    <div>
                      <span>{copy.flow}</span>
                      <strong id="brew-flow">5.0</strong>
                    </div>
                    <div>
                      <span>{copy.volume}</span>
                      <strong id="brew-volume">000 / 300</strong>
                    </div>
                  </div>
                  <span className="simulation-note mono">
                    {copy.simulation}
                  </span>
                </div>
              </>
            )}
            {act.id === "purpose" && (
              <div className="editorial purpose-editorial">
                <p className="eyebrow">{copy.purposeEyebrow}</p>
                <div className="new-bag mono">
                  {copy.newBag} <span>{copy.shouldNot}</span>{" "}
                  {copy.newTechnique}
                </div>
                <h2>
                  {copy.purposeLine1}
                  <br />
                  {copy.purposeLine2}
                  <br />
                  <em>{copy.purposeEmphasis}</em>
                </h2>
                <ol className="workflow" aria-label={copy.workflowLabel}>
                  <li>
                    <span className="workflow-number mono" aria-hidden="true">
                      01
                    </span>
                    <div>
                      <h3>{copy.scan}</h3>
                      <p>{copy.scanText}</p>
                    </div>
                  </li>
                  <li>
                    <span className="workflow-number mono" aria-hidden="true">
                      02
                    </span>
                    <div>
                      <h3>{copy.choose}</h3>
                      <p>{copy.chooseText}</p>
                    </div>
                  </li>
                  <li>
                    <span className="workflow-number mono" aria-hidden="true">
                      03
                    </span>
                    <div>
                      <h3>{copy.brew}</h3>
                      <p>{copy.brewText}</p>
                    </div>
                  </li>
                </ol>
                <p className="body-copy">{copy.purposeBody}</p>
              </div>
            )}
            {act.id === "launch" && (
              <>
                <div className="editorial final-editorial">
                  <p className="eyebrow">{copy.launchEyebrow}</p>
                  <h2>
                    {copy.launchTitle}
                    <br />
                    <em>{copy.launchEmphasis}</em>
                  </h2>
                  <p className="final-invite">{copy.finalInvite}</p>
                  <p className="body-copy">{copy.prototypeNow}</p>
                  <MagneticButton onClick={onLaunch}>
                    {copy.notify}
                  </MagneticButton>
                  <a className="join-link mono" href="#preorder">
                    {copy.preorderLink}
                  </a>
                </div>
                <div className="final-wordmark" aria-hidden="true">
                  FIRST BREW
                </div>
              </>
            )}
          </div>
        </section>
      ))}
      <DevelopmentSection language={language} />
      <PreorderSection language={language} />
    </main>
  );
}
