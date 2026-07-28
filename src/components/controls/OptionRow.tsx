type Option = { key: string; label: string; sublabel?: string };

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
          className="option"
          aria-pressed={option.key === selectedKey}
          onClick={() => onSelect(option.key)}
        >
          <span className="option-label">{option.label}</span>
          {option.sublabel && <span className="option-sub">{option.sublabel}</span>}
        </button>
      ))}
    </div>
  );
}
