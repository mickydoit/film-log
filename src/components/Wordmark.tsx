/**
 * The mark and logotype.
 *
 * A ring of 35mm film perforations around an aperture iris — the two things
 * this app is actually about: frames on a strip, and the hole you chose to
 * let light through. Geometry is computed, not eyeballed: twelve
 * perforations on a 19.6 radius, each rotated to face the rim, and six
 * blades swept from a hexagon to the housing 60° on.
 *
 * Drawn inline rather than loaded, so it renders before anything else and
 * works with no connection.
 */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 48 48" aria-hidden="true">
      {/* film perforations */}
      <g fill="currentColor" opacity="0.9">
        <rect x="41.10" y="22.20" width="5" height="3.6" rx="1.1" transform="rotate(90 43.60 24.00)" />
        <rect x="38.47" y="32.00" width="5" height="3.6" rx="1.1" transform="rotate(120 40.97 33.80)" />
        <rect x="31.30" y="39.17" width="5" height="3.6" rx="1.1" transform="rotate(150 33.80 40.97)" />
        <rect x="21.50" y="41.80" width="5" height="3.6" rx="1.1" transform="rotate(180 24.00 43.60)" />
        <rect x="11.70" y="39.17" width="5" height="3.6" rx="1.1" transform="rotate(210 14.20 40.97)" />
        <rect x="4.53" y="32.00" width="5" height="3.6" rx="1.1" transform="rotate(240 7.03 33.80)" />
        <rect x="1.90" y="22.20" width="5" height="3.6" rx="1.1" transform="rotate(270 4.40 24.00)" />
        <rect x="4.53" y="12.40" width="5" height="3.6" rx="1.1" transform="rotate(300 7.03 14.20)" />
        <rect x="11.70" y="5.23" width="5" height="3.6" rx="1.1" transform="rotate(330 14.20 7.03)" />
        <rect x="21.50" y="2.60" width="5" height="3.6" rx="1.1" transform="rotate(360 24.00 4.40)" />
        <rect x="31.30" y="5.23" width="5" height="3.6" rx="1.1" transform="rotate(390 33.80 7.03)" />
        <rect x="38.47" y="12.40" width="5" height="3.6" rx="1.1" transform="rotate(420 40.97 14.20)" />
      </g>

      {/* aperture housing, blades and opening */}
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <circle cx="24" cy="24" r="12.6" />
        <path d="M29.60 24.00L30.30 34.91M26.80 28.85L17.70 34.91M21.20 28.85L11.40 24.00M18.40 24.00L17.70 13.09M21.20 19.15L30.30 13.09M26.80 19.15L36.60 24.00" />
        <polygon points="29.60,24.00 26.80,28.85 21.20,28.85 18.40,24.00 21.20,19.15 26.80,19.15" />
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
