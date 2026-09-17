export default function DevelopmentSection() {
  return (
    <section
      id="development"
      className="development-section"
      aria-labelledby="development-title"
    >
      <p className="eyebrow">DEVELOPMENT</p>
      <h2 id="development-title">
        We’re building First Brew’s
        <br />
        <em>first prototype.</em>
      </h2>
      <p className="development-intro">
        Our next step is to turn a coffee recipe into a complete, automated
        pour—from water temperature and flow to the movement of the nozzle.
      </p>
      <ol className="development-progress">
        <li>
          <span className="mono">01 / DEFINED</span>
          <h3>Prototype architecture</h3>
        </li>
        <li>
          <span className="mono">02 / SELECTED</span>
          <h3>Components</h3>
        </li>
        <li>
          <span className="mono">03 / NEXT</span>
          <h3>Automated brewing tests</h3>
        </li>
      </ol>
      <div className="development-validation">
        <p className="eyebrow">WHAT WE’LL TEST</p>
        <p>Brew repeatability. Active user time. Water-delivery accuracy.</p>
        <p>
          Then we’ll test the complete experience with home specialty-coffee
          drinkers.
        </p>
      </div>
    </section>
  );
}
