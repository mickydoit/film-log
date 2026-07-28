/**
 * The markings actually printed on the Pentax 17.
 *
 * Most of the mode dial is lettering — AUTO, P, BOKEH, B — so those render as
 * type, not as invented pictograms. Only the slow-speed and the two flash
 * positions are symbols. The lens barrel is entirely pictographic: flower,
 * cutlery, one/two/three people, mountain.
 *
 * Colour follows the dial: AUTO is blue, the flash positions are orange, the
 * rest white. Everything uses currentColor so it inverts correctly when a
 * control is selected and the tile fills with bone.
 */

export type GlyphName =
  | 'auto' | 'program' | 'moon' | 'bokeh' | 'bulb'
  | 'flash-day' | 'flash-slow'
  | 'flower' | 'cutlery' | 'person' | 'people-two' | 'people-three'
  | 'mountain';

const S = { className: 'glyph-svg', viewBox: '0 0 24 24', 'aria-hidden': true } as const;

/** A crescent, as printed beside the slow-speed positions. */
function Moon({ x = 0 }: { x?: number }) {
  return (
    <path
      transform={`translate(${x} 0)`}
      d="M15.6 4.2a8 8 0 1 0 4.2 10.9 6.4 6.4 0 0 1-4.2-10.9Z"
      fill="currentColor"
    />
  );
}

/** The flash bolt shared by both sync positions. */
function Bolt({ x = 0, scale = 1 }: { x?: number; scale?: number }) {
  return (
    <path
      transform={`translate(${x} 0) scale(${scale})`}
      d="M13.2 2 5.6 13.4h5l-1.6 8.6 7.8-11.6h-5.2L13.2 2Z"
      fill="currentColor"
    />
  );
}

function Person({ x = 0, scale = 1 }: { x?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} 0) scale(${scale})`} fill="currentColor">
      <circle cx="12" cy="6.4" r="3.1" />
      <path d="M12 10.6c-3.5 0-5.6 2.2-5.6 5.3V22h11.2v-6.1c0-3.1-2.1-5.3-5.6-5.3Z" />
    </g>
  );
}

export function Glyph({ name }: { name: GlyphName }) {
  switch (name) {
    /* ---- mode dial lettering ---- */
    case 'auto':
      return <span className="glyph glyph-auto">AUTO</span>;
    case 'program':
      return <span className="glyph">P</span>;
    case 'bokeh':
      return <span className="glyph glyph-word">BOKEH</span>;
    case 'bulb':
      return <span className="glyph">B</span>;

    /* ---- mode dial symbols ---- */
    case 'moon':
      return (
        <span className="glyph">
          <svg {...S}><Moon /></svg>
        </span>
      );
    case 'flash-day':
      return (
        <span className="glyph glyph-flash">
          <svg {...S} viewBox="0 0 34 24">
            <Bolt x={-2} scale={0.82} />
            <text x="20" y="19" fontSize="17" fill="currentColor"
              fontFamily="inherit" fontWeight="700">P</text>
          </svg>
        </span>
      );
    case 'flash-slow':
      return (
        <span className="glyph glyph-flash">
          <svg {...S} viewBox="0 0 40 24">
            <Bolt x={-2} scale={0.82} />
            <g transform="translate(15 0) scale(0.86)"><Moon /></g>
          </svg>
        </span>
      );

    /* ---- lens barrel pictograms ---- */
    case 'flower':
      return (
        <span className="glyph">
          <svg {...S}>
            <g fill="currentColor">
              <circle cx="12" cy="7.4" r="3" />
              <circle cx="7.1" cy="11" r="3" />
              <circle cx="16.9" cy="11" r="3" />
              <circle cx="9" cy="16.6" r="3" />
              <circle cx="15" cy="16.6" r="3" />
            </g>
            <path d="M12 12v10" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </span>
      );
    case 'cutlery':
      return (
        <span className="glyph">
          <svg {...S}>
            <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
              {/* fork */}
              <path d="M7 2v6.2a2.2 2.2 0 0 0 4.4 0V2M9.2 2v6M9.2 10.4V22" />
              {/* knife */}
              <path d="M17 22v-9" />
            </g>
            <path d="M17 2c2.6 1.8 2.6 8.6 0 11V2Z" fill="currentColor" />
          </svg>
        </span>
      );
    case 'person':
      return (
        <span className="glyph">
          <svg {...S}><Person /></svg>
        </span>
      );
    case 'people-two':
      return (
        <span className="glyph">
          <svg {...S} viewBox="0 0 34 24">
            <Person x={-1} scale={0.78} />
            <Person x={12} scale={0.78} />
          </svg>
        </span>
      );
    case 'people-three':
      return (
        <span className="glyph">
          <svg {...S} viewBox="0 0 42 24">
            <Person x={-3} scale={0.66} />
            <Person x={7} scale={0.66} />
            <Person x={17} scale={0.66} />
          </svg>
        </span>
      );
    case 'mountain':
      return (
        <span className="glyph">
          <svg {...S}>
            <path
              d="M2 20 9.4 8l4.2 6.6L16 11l6 9H2Z"
              fill="currentColor"
            />
          </svg>
        </span>
      );
  }
}
