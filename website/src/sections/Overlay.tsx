import { acts, story, type Part } from "../data/story";
import { goToAct } from "../hooks/useStory";
import MagneticButton from "../components/MagneticButton";

function Value({
  label,
  value,
  part,
}: {
  label: string;
  value: string;
  part: Part;
}) {
  return (
    <button
      className="recipe-value"
      onPointerEnter={() => {
        story.highlight = part;
      }}
      onPointerLeave={() => {
        story.highlight = null;
      }}
      onFocus={() => {
        story.highlight = part;
      }}
      onBlur={() => {
        story.highlight = null;
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <i aria-hidden="true">↗</i>
    </button>
  );
}

export default function Overlay({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main className="story" id="story">
      {acts.map((act, i) => (
        <section
          className={`act act-${act.id}`}
          id={act.id}
          style={{ height: `${act.scrollVh}svh` }}
          key={act.id}
          aria-label={`${i + 1}. ${act.label}`}
        >
          <div className={`act-panel panel-${act.id}`}>
            {i === 0 && (
              <>
                <div className="hero-copy">
                  <p className="eyebrow">
                    <span className="status-dot" />
                    AUTOMATIC POUR-OVER / FB–01
                  </p>
                  <h1>
                    Every bag.
                    <br />
                    <em>Its own pour.</em>
                  </h1>
                  <p className="body-copy">
                    Brew every new bag with a recipe matched to that coffee —
                    without manually controlling the pour.
                  </p>
                  <button className="scroll-link" onClick={() => goToAct(1)}>
                    SEE HOW IT BREWS <span aria-hidden="true">↓</span>
                  </button>
                </div>
                <div className="object-caption mono">
                  <span>DESIGNED AROUND THE POUR.</span>
                  <span>A WORKING IDEA. A PHYSICAL OBJECT.</span>
                </div>
                <div className="hero-index mono">
                  01—07 <span>SCROLL TO EXPLORE</span>
                  <i />
                </div>
              </>
            )}
            {i === 1 && (
              <div className="editorial">
                <p className="eyebrow">01 / THE RECIPE BECOMES PHYSICAL</p>
                <h2>
                  A recipe is
                  <br />
                  more than
                  <br />
                  <em>instructions.</em>
                </h2>
                <p className="body-copy">First Brew turns it into movement.</p>
                <div className="recipe-equation">
                  <span className="mono">RECIPE ↓</span>
                  <Value label="TEMPERATURE" value="92 °C" part="heater" />
                  <Value label="FLOW" value="5.0 ml/s" part="flow" />
                  <Value label="VOLUME" value="300 ml" part="reservoir" />
                  <Value label="PULSES / BLOOM" value="03 / 45 s" part="flow" />
                  <Value label="TRAJECTORY" value="Spiral" part="nozzle" />
                </div>
                <p className="statement">
                  We don’t only recommend the recipe.
                  <br />
                  <strong>We physically reproduce it.</strong>
                </p>
                <span className="fineprint mono">
                  ILLUSTRATIVE PROFILE · HOVER OR FOCUS TO INSPECT
                </span>
              </div>
            )}
            {i === 2 && (
              <div className="editorial">
                <p className="eyebrow">02 / ANATOMY OF A POUR</p>
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
                  <span>FB–01 / COMPONENT STUDY</span>
                  <span>EXPLODED VIEW</span>
                  <span>CONCEPT GEOMETRY · NOT TO SCALE</span>
                </div>
              </div>
            )}
            {i === 3 && (
              <div className="editorial scan-editorial">
                <p className="eyebrow">03 / MEET YOUR NEXT BAG</p>
                <h2>
                  New coffee.
                  <br />
                  <em>Its own recipe.</em>
                </h2>
                <p className="body-copy">
                  Scan your coffee.
                  <br />
                  Choose the recommended recipe.
                </p>
                <div className="appliance-recipe">
                  <div className="recipe-header mono">
                    <span className="status-dot" />
                    COFFEE RECOGNIZED <span>↙</span>
                  </div>
                  <h3>ETHIOPIA GUJI</h3>
                  <p className="mono origin">NATURAL / LIGHT ROAST</p>
                  <div className="recipe-specs">
                    <Value label="DOSE" value="18 g" part="dripper" />
                    <Value label="WATER" value="300 ml" part="reservoir" />
                    <Value label="TEMP" value="92 °C" part="heater" />
                  </div>
                  <div className="pour-rows mono">
                    <span>Bloom / included in pour 01</span>
                    <span>45 s</span>
                    <span>Pour 01</span>
                    <span>90 ml</span>
                    <span>Pour 02</span>
                    <span>110 ml</span>
                    <span>Pour 03</span>
                    <span>100 ml</span>
                  </div>
                  <p className="prepare-note">
                    Grind your beans. Load your V60. Fill the tank.
                  </p>
                  <MagneticButton onClick={() => goToAct(4)}>
                    BREW
                  </MagneticButton>
                  <span className="fineprint mono">
                    ILLUSTRATIVE SCAN & RECIPE
                  </span>
                </div>
              </div>
            )}
            {i === 4 && (
              <>
                <div className="editorial brew-editorial">
                  <p className="eyebrow">04 / THE POUR, TAKEN CARE OF</p>
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
              </>
            )}
            {i === 5 && (
              <div className="editorial purpose-editorial">
                <p className="eyebrow">05 / A FAMILIAR GESTURE</p>
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
                <button className="press-brew" onClick={() => goToAct(4)}>
                  Press Brew. <span>↗</span>
                </button>
                <div className="workflow mono">
                  SCAN <span>→</span> CHOOSE <span>→</span> BREW
                </div>
                <p className="body-copy">
                  First Brew handles the temperature, water flow, timing,
                  pulses, pauses, and pouring pattern automatically.
                </p>
              </div>
            )}
            {i === 6 && (
              <>
                <div className="editorial final-editorial">
                  <p className="eyebrow">06 / ROOM FOR A NEW RITUAL</p>
                  <h2>
                    Every bag.
                    <br />
                    <em>Its own pour.</em>
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
                  <div className="prototype-status mono">
                    <span className="status-title">
                      <span className="status-dot" /> PROTOTYPE STATUS
                    </span>
                    <p>
                      Architecture defined
                      <br />
                      Components selected
                      <br />
                      <span className="copper">
                        Automated brewing tests next ↗
                      </span>
                    </p>
                    <span className="status-title">NEXT TO VALIDATE</span>
                    <p>
                      Brew repeatability · Active user time
                      <br />
                      Water-delivery accuracy
                    </p>
                  </div>
                </div>
                <div className="final-wordmark" aria-hidden="true">
                  FIRST BREW
                </div>
                <footer className="end-footer mono">
                  <span>
                    © {new Date().getFullYear()} FIRST BREW / A POUR POUR
                    PROJECT
                  </span>
                  <button onClick={() => goToAct(0)}>
                    BACK TO THE OBJECT ↑
                  </button>
                </footer>
              </>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
