import { copyFor, type Language } from "../i18n";

export default function DevelopmentSection({
  language,
}: {
  language: Language;
}) {
  const copy = copyFor(language);
  return (
    <section
      id="development"
      className="development-section"
      aria-labelledby="development-title"
    >
      <p className="eyebrow">{copy.development}</p>
      <h2 id="development-title">
        {copy.developmentTitle}
        <br />
        <em>{copy.developmentEmphasis}</em>
      </h2>
      <p className="development-intro">{copy.developmentIntro}</p>
      <ol className="development-progress">
        <li>
          <span className="mono">{copy.defined}</span>
          <h3>{copy.architecture}</h3>
        </li>
        <li>
          <span className="mono">{copy.selected}</span>
          <h3>{copy.components}</h3>
        </li>
        <li>
          <span className="mono">{copy.next}</span>
          <h3>{copy.brewingTests}</h3>
        </li>
      </ol>
      <div className="development-validation">
        <p className="eyebrow">{copy.whatTest}</p>
        <p>{copy.validation1}</p>
        <p>{copy.validation2}</p>
      </div>
    </section>
  );
}
