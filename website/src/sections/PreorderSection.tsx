import { goToAct } from "../hooks/useStory";
import { copyFor, type Language } from "../i18n";

const SURVEY_URL = "https://forms.yandex.ru/u/6ab10c8390fa7ba71fa6d1cb";

export default function PreorderSection({ language }: { language: Language }) {
  const copy = copyFor(language);
  return (
    <section
      id="preorder"
      className="join-section"
      aria-labelledby="preorder-title"
    >
      <div className="join-intro">
        <p className="eyebrow">{copy.preorder}</p>
        <h2 id="preorder-title">
          {copy.preorderTitle}
          <br />
          <em>{copy.preorderEmphasis}</em>
        </h2>
        <p className="body-copy">{copy.preorderBody}</p>
        <p className="body-copy join-note">{copy.preorderNote}</p>
      </div>
      <div className="survey-card">
        <span className="survey-badge mono">{copy.surveyBadge}</span>
        <div>
          <h3>{copy.surveyTitle}</h3>
          <p>{copy.surveyText}</p>
        </div>
        <a
          className="action"
          href={SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.surveyButton} <span aria-hidden="true">↗</span>
        </a>
      </div>
      <footer className="join-footer mono">
        <span>© {new Date().getFullYear()} FIRST BREW</span>
        <button onClick={() => goToAct(0)}>{copy.backTop}</button>
      </footer>
    </section>
  );
}
