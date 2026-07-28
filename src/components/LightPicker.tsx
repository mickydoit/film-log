import { LIGHTS, type LightId } from '../lib/exposure';

export function LightPicker({
  value, onChange,
}: {
  value: LightId | null;
  onChange: (light: LightId) => void;
}) {
  return (
    <fieldset className="control">
      <legend>Light</legend>
      <div className="option-row light-row">
        {LIGHTS.map(light => (
          <button
            key={light.id}
            type="button"
            className="option"
            aria-pressed={light.id === value}
            onClick={() => onChange(light.id)}
          >
            <span className="light-icon" aria-hidden="true">{light.icon}</span>
            <span className="option-label">{light.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
