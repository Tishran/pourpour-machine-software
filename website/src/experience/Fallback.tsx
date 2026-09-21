import { copyFor, type Language } from "../i18n";

export default function Fallback({
  loading = false,
  language = "ru",
}: {
  loading?: boolean;
  language?: Language;
}) {
  const copy = copyFor(language);
  return (
    <div className="fallback-object">
      <svg viewBox="0 0 500 580" role="img" aria-label={copy.machineAlt}>
        <defs>
          <linearGradient id="ceramic" x2="1" y2="0">
            <stop stopColor="#a9aaa1" />
            <stop offset=".4" stopColor="#e9e5dc" />
            <stop offset="1" stopColor="#c4c5bb" />
          </linearGradient>
        </defs>
        <ellipse cx="265" cy="524" rx="155" ry="15" fill="#000" opacity=".12" />
        <path d="M350 111h48v383h-48z" fill="url(#ceramic)" />
        <rect
          x="105"
          y="474"
          width="298"
          height="39"
          rx="9"
          fill="url(#ceramic)"
        />
        <rect
          x="108"
          y="87"
          width="296"
          height="62"
          rx="10"
          fill="url(#ceramic)"
        />
        <path d="M121 151h258v13H121z" fill="#292c27" />
        <path d="M237 164v38h15v-38" fill="#b0b8b5" />
        <path
          d="M242 204v68"
          stroke="#abc2bb"
          strokeWidth="3"
          strokeDasharray="5 4"
        />
        <path d="M175 285h143l-53 89h-36z" fill="#e7dfcc" />
        <ellipse cx="247" cy="286" rx="68" ry="11" fill="#4c3021" />
        <path
          d="M221 378h49v33l31 60q-53 21-107 0l27-60z"
          fill="#b8c7be"
          fillOpacity=".25"
          stroke="#b4beb3"
          strokeWidth="2"
        />
        <path d="M203 452h90l8 19q-53 21-107 0z" fill="#59301b" />
        <rect
          x="120"
          y="167"
          width="43"
          height="291"
          rx="12"
          fill="#b7c6bb"
          fillOpacity=".2"
          stroke="#a6aea1"
        />
        <text
          x="129"
          y="124"
          fontFamily="monospace"
          fontSize="16"
          fill="#282c24"
        >
          first brew
        </text>
        <text
          x="334"
          y="122"
          fontFamily="monospace"
          fontSize="9"
          fill="#282c24"
        >
          FIRST BREW
        </text>
      </svg>
      <span className="mono fallback-note">
        {loading ? copy.assembling : copy.staticView}
      </span>
    </div>
  );
}
