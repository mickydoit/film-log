import { Glyph, type GlyphName } from './Glyph';

type Option = {
  key: string;
  label: string;
  sublabel?: string;
  /** Marking printed on the camera for this position, if there is one. */
  glyph?: string;
};

export function OptionRow({
  options, selectedKey, onSelect,
}: {
  options: Option[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="option-row">
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          className={`option${option.glyph ? ' option-glyph' : ''}`}
          aria-pressed={option.key === selectedKey}
          // When the camera prints a symbol, the symbol is what you see — but
          // the accessible name stays the word, so the control is still
          // announced and testable by what it means.
          aria-label={option.glyph ? option.label : undefined}
          onClick={() => onSelect(option.key)}
        >
          {option.glyph
            ? <Glyph name={option.glyph as GlyphName} />
            : <span className="option-label">{option.label}</span>}
          {option.sublabel && <span className="option-sub">{option.sublabel}</span>}
        </button>
      ))}
    </div>
  );
}
