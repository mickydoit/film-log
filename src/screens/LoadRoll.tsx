import { useState } from 'react';
import { getCamera, frameCapacity, type CameraId } from '../cameras';
import { createRoll } from '../lib/rolls';
import type { Roll } from '../lib/types';
import { pushPullLabel } from './pushPull';

const FILM_SPEEDS = [
  12, 20, 25, 32, 50, 64, 100, 125, 160, 200, 250, 320,
  400, 500, 640, 800, 1000, 1250, 1600, 3200,
];

/**
 * The film speed named in the text, but only when the text names exactly one.
 *
 * Positional rules ("take the last number") are unsafe: "Kodak Portra 800
 * pushed to 1600" would set the box speed to 1600 and silence the very push
 * warning the user needs. When the text is ambiguous, detecting nothing is
 * correct — the field keeps its default and the hint tells the user to check
 * the canister. A repeated single speed is not ambiguous.
 */
export function detectFilmSpeed(name: string): number | null {
  const numbers = [...name.matchAll(/\d{2,4}/g)].map(m => Number(m[0]));
  const distinct = [...new Set(numbers.filter(n => FILM_SPEEDS.includes(n)))];
  return distinct.length === 1 ? distinct[0] : null;
}

const COMMON_STOCKS = [
  'Kodak Gold 200', 'Kodak ColorPlus 200', 'Kodak Portra 400',
  'Kodak Ultramax 400', 'Ilford HP5 Plus 400', 'Ilford XP2 400',
  'Fujifilm C200', 'Cinestill 400D',
];

export function LoadRoll({
  cameraId, onDone, onCancel,
}: {
  cameraId: CameraId;
  onDone: (roll: Roll) => void;
  onCancel: () => void;
}) {
  const camera = getCamera(cameraId);
  const [stock, setStock] = useState('');
  const [boxIso, setBoxIso] = useState(200);
  const [isoSet, setIsoSet] = useState(200);
  const [exposures, setExposures] = useState(36);
  const [isoDetected, setIsoDetected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capacity = frameCapacity(camera, exposures);
  const pushPull = pushPullLabel(boxIso, isoSet);

  async function save() {
    if (!stock.trim()) { setError('Which film is it?'); return; }
    setSaving(true);
    setError(null);
    try {
      onDone(await createRoll({
        camera_id: camera.id,
        film_stock: stock.trim(),
        box_iso: boxIso,
        iso_set: isoSet,
        exposures,
      }));
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>Load {camera.name}</h1>

      <fieldset className="control">
        <legend>Film</legend>
        <input
          className="text-input"
          value={stock}
          onChange={e => {
            setStock(e.target.value);
            const iso = detectFilmSpeed(e.target.value);
            if (iso) {
              setBoxIso(iso);
              setIsoSet(iso);
              setIsoDetected(true);
            } else {
              setIsoDetected(false);
            }
          }}
          list="stocks"
          placeholder="Kodak Gold 200"
          aria-label="Film stock"
        />
        <datalist id="stocks">
          {COMMON_STOCKS.map(s => <option key={s} value={s} />)}
        </datalist>
      </fieldset>

      <fieldset className="control">
        <legend>Box speed</legend>
        <input
          className="text-input" type="number" value={boxIso}
          onChange={e => { setBoxIso(Number(e.target.value)); setIsoDetected(false); }}
          aria-label="Box ISO"
        />
        <p className="hint">
          {isoDetected
            ? 'Read from the film name — check it matches the canister.'
            : 'What the film actually is, printed on the canister.'}
        </p>
      </fieldset>

      <fieldset className="control">
        <legend>ISO dialled on the camera</legend>
        <div className="option-row">
          {camera.isoValues.map(iso => (
            <button
              key={iso} type="button" className="option"
              aria-pressed={iso === isoSet}
              onClick={() => setIsoSet(iso)}
            >
              <span className="option-label">{iso}</span>
            </button>
          ))}
        </div>
        {pushPull && <p className="badge-warning">{pushPull}</p>}
      </fieldset>

      <fieldset className="control">
        <legend>Exposures</legend>
        <div className="option-row">
          {[24, 36].map(n => (
            <button
              key={n} type="button" className="option"
              aria-pressed={n === exposures}
              onClick={() => setExposures(n)}
            >
              <span className="option-label">{n}</span>
            </button>
          ))}
        </div>
        <p className="hint">
          {camera.format === 'half'
            ? `Half-frame: ${exposures} exposures give you ${capacity} frames.`
            : `${capacity} frames.`}
        </p>
      </fieldset>

      {error && <p className="error">{error}</p>}

      <div className="card-actions">
        <button type="button" className="primary" onClick={save} disabled={saving}>
          {saving ? 'Loading…' : 'Load it'}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </main>
  );
}
