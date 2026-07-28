/**
 * The compass star and logotype.
 *
 * Eight rays with rounded caps — the mark stamped on expedition badges and
 * old survey markers. Drawn inline rather than loaded, so it renders before
 * anything else and works offline.
 */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M24 5v38M5 24h38M11 11l26 26M37 11L11 37" />
      </g>
    </svg>
  );
}

export function Wordmark({ tagline }: { tagline: string }) {
  return (
    <div className="wordmark">
      <Mark />
      <h1>Film Log</h1>
      <p className="tagline">{tagline}</p>
    </div>
  );
}
