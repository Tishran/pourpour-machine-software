import { acts } from "../data/story";
import MagneticButton from "../components/MagneticButton";
import PreorderSection from "./PreorderSection";
import DevelopmentSection from "./DevelopmentSection";

export default function Overlay({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main className="story" id="story">
      {acts.map((act, i) => (
        <section
          className={`act act-${act.id}`}
          id={act.id}
          key={act.id}
          aria-label={`${i + 1}. ${act.label}`}
        >
          <div className={`act-panel panel-${act.id}`}>
            {act.id === "object" && (
              <>
                <div className="hero-copy">
                  <p className="eyebrow">
                    <span className="status-dot" />
                    AUTOMATIC POUR-OVER
                  </p>
                  <h1>
                    We finally bring you
                    <br />
                    <em>the tasty coffee</em>
                  </h1>
                  <p className="body-copy">
                    Brew every new bag with a recipe matched to that coffee —
                    without manually controlling the pour.
                  </p>
                </div>
                <div className="object-caption mono">
                  <span>DESIGNED AROUND THE POUR.</span>
                  <span>A WORKING IDEA. A PHYSICAL OBJECT.</span>
                </div>
                <div className="hero-index mono">
                  01—05 <span>SCROLL TO EXPLORE</span>
                  <i />
                </div>
              </>
            )}
            {act.id === "engineering" && (
              <div className="editorial">
                <p className="eyebrow">03 / ANATOMY OF A POUR</p>
                <h2>
                  Nothing extra.
                  <br />
                  <em>
                    Every part
                    <br />
                    has a purpose.
                  </em>
                </h2>
                <p className="body-copy">
                  Your V60 stays.
                  <br />
                  The repetitive pouring doesn’t.
                </p>
                <div className="engineering-legend mono">
                  <span>COMPONENT STUDY</span>
                  <span>COMPONENT DETAIL</span>
                  <span>CONCEPT GEOMETRY · NOT TO SCALE</span>
                </div>
              </div>
            )}
            {act.id === "brew" && (
              <>
                <div className="editorial brew-editorial">
                  <p className="eyebrow">02 / THE POUR, TAKEN CARE OF</p>
                  <h2>
                    Precision.
                    <br />
                    In <em>motion.</em>
                  </h2>
                  <p className="body-copy">
                    The nozzle follows the recipe.
                    <br />
                    The water follows the nozzle.
                  </p>
                  <span className="brew-phase mono" id="brew-phase">
                    01 / CENTER POUR
                  </span>
                  <div className="brew-instruction mono">
                    <span>↓</span> SCROLL SLOWLY TO FOLLOW THE POUR
                  </div>
                  <div className="brew-hud">
                    <div>
                      <span>BREW TIME</span>
                      <strong id="brew-timer">00:00</strong>
                    </div>
                    <div>
                      <span>TEMPERATURE</span>
                      <strong>
                        92<small> °C</small>
                      </strong>
                    </div>
                    <div>
                      <span>FLOW / ML/S</span>
                      <strong id="brew-flow">5.0</strong>
                    </div>
                    <div>
                      <span>VOLUME / ML</span>
                      <strong id="brew-volume">000 / 300</strong>
                    </div>
                  </div>
                  <span className="simulation-note mono">
                    SCROLL-CONTROLLED SIMULATION · ILLUSTRATIVE PARAMETERS
                  </span>
                </div>
              </>
            )}
            {act.id === "purpose" && (
              <div className="editorial purpose-editorial">
                <p className="eyebrow">01 / A FAMILIAR GESTURE</p>
                <div className="new-bag mono">
                  NEW BAG <span>should not require</span> NEW POURING TECHNIQUE
                </div>
                <h2>
                  Different coffee.
                  <br />
                  Different recipe.
                  <br />
                  <em>Same gesture.</em>
                </h2>
                <ol className="workflow" aria-label="How First Brew works">
                  <li>
                    <span className="workflow-number mono" aria-hidden="true">
                      01
                    </span>
                    <div>
                      <h3>SCAN</h3>
                      <p>Photograph your coffee bag.</p>
                    </div>
                  </li>
                  <li>
                    <span className="workflow-number mono" aria-hidden="true">
                      02
                    </span>
                    <div>
                      <h3>CHOOSE</h3>
                      <p>Select the recommended recipe.</p>
                    </div>
                  </li>
                  <li>
                    <span className="workflow-number mono" aria-hidden="true">
                      03
                    </span>
                    <div>
                      <h3>BREW</h3>
                      <p>Load your V60. First Brew performs the pour.</p>
                    </div>
                  </li>
                </ol>
                <p className="body-copy">
                  First Brew handles the temperature, water flow, timing,
                  pulses, pauses, and pouring pattern automatically.
                </p>
              </div>
            )}
            {act.id === "launch" && (
              <>
                <div className="editorial final-editorial">
                  <p className="eyebrow">04 / ROOM FOR A NEW RITUAL</p>
                  <h2>
                    We finally bring you
                    <br />
                    <em>the tasty coffee</em>
                  </h2>
                  <p className="final-invite">
                    Bring First Brew to your kitchen.
                  </p>
                  <p className="body-copy">
                    We’re building the first working prototype now.
                  </p>
                  <MagneticButton onClick={onLaunch}>
                    GET NOTIFIED AT LAUNCH
                  </MagneticButton>
                  <a className="join-link mono" href="#preorder">
                    PREORDER FIRST BREW ↓
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
      <DevelopmentSection />
      <PreorderSection />
    </main>
  );
}
