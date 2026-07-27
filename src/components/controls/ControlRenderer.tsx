import type { Control, Settings } from '../../cameras';
import { OptionRow } from './OptionRow';

/** Exposure compensation reads better with an explicit sign. */
export function formatStops(stops: number): string {
  if (stops === 0) return '0';
  const sign = stops > 0 ? '+' : '−';
  return `${sign}${Math.abs(stops)}`;
}

export function ControlRenderer({
  controls, value, onChange,
}: {
  controls: Control[];
  value: Settings;
  onChange: (next: Settings) => void;
}) {
  const set = (id: string, next: Settings[string]) =>
    onChange({ ...value, [id]: next });

  return (
    <div className="controls">
      {controls.map(control => (
        <fieldset key={control.id} className="control">
          <legend>{control.label}</legend>

          {control.type === 'select' && (
            <OptionRow
              options={control.values.map(v => ({ key: v, label: v }))}
              selectedKey={String(value[control.id] ?? '')}
              onSelect={v => set(control.id, v)}
            />
          )}

          {control.type === 'zone' && (
            <OptionRow
              options={control.values.map(z => ({
                key: z.label, label: z.label, sublabel: z.range,
              }))}
              selectedKey={String(value[control.id] ?? '')}
              onSelect={v => set(control.id, v)}
            />
          )}

          {control.type === 'stops' && (
            <OptionRow
              options={control.values.map(s => ({
                key: String(s), label: formatStops(s),
              }))}
              selectedKey={String(value[control.id] ?? 0)}
              onSelect={v => set(control.id, Number(v))}
            />
          )}

          {control.type === 'toggle' && (
            <button
              type="button"
              role="switch"
              className="toggle"
              aria-checked={Boolean(value[control.id])}
              aria-label={control.label}
              onClick={() => set(control.id, !value[control.id])}
            >
              {value[control.id] ? 'On' : 'Off'}
            </button>
          )}

          {control.hint && <p className="hint">{control.hint}</p>}
        </fieldset>
      ))}
    </div>
  );
}
