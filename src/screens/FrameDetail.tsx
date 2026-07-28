import { useEffect, useState } from 'react';
import { getCamera } from '../cameras';
import { signedScanUrl } from '../lib/scans';
import { updateShot } from '../lib/shots';
import { requestCritique } from '../lib/critique';
import { estimateShutter, LIGHTS } from '../lib/exposure';
import type { Critique, Roll, Shot } from '../lib/types';

const SECTIONS: { key: keyof Critique; label: string }[] = [
  { key: 'exposure', label: 'Exposure' },
  { key: 'focus', label: 'Focus' },
  { key: 'motion', label: 'Motion' },
  { key: 'depth_of_field', label: 'Depth of field' },
];

export function FrameDetail({
  shot: initial, roll, onBack,
}: {
  shot: Shot;
  roll: Roll;
  onBack: () => void;
}) {
  const camera = getCamera(roll.camera_id);
  const [shot, setShot] = useState(initial);
  const [url, setUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState(shot.my_notes ?? '');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shot.scan_path) signedScanUrl(shot.scan_path).then(setUrl).catch(() => setUrl(null));
  }, [shot.scan_path]);

  const light = LIGHTS.find(l => l.id === shot.light);
  const estimate =
    camera.estimatesShutter && shot.light && typeof shot.settings.aperture === 'string'
      ? estimateShutter({
          aperture: shot.settings.aperture,
          iso: roll.iso_set,
          light: shot.light,
          compensationEv: shot.settings.backlight === true ? 1.5 : 0,
        })
      : null;

  async function critique() {
    setThinking(true);
    setError(null);
    try {
      const result = await requestCritique(shot, roll);
      const saved = await updateShot(shot.id, { ai_critique: result });
      setShot(saved);
    } catch (e) {
      setError((e as Error).message);
    }
    setThinking(false);
  }

  async function saveNotes() {
    const saved = await updateShot(shot.id, { my_notes: notes.trim() || null });
    setShot(saved);
  }

  return (
    <main>
      <header className="shelf-head">
        <h1>Frame {shot.frame_number}</h1>
        <button type="button" className="link" onClick={onBack}>Back</button>
      </header>

      {url
        ? <img className="scan" src={url} alt={`Frame ${shot.frame_number}`} />
        : <p className="muted">No scan attached yet.</p>}

      <section className="settings-readout">
        <h2>What you set</h2>
        <dl>
          {camera.controls.map(control => (
            <div key={control.id}>
              <dt>{control.label}</dt>
              <dd>{formatValue(shot.settings[control.id])}</dd>
            </div>
          ))}
          {light && (
            <div><dt>Light</dt><dd>{light.icon} {light.label}</dd></div>
          )}
          {estimate && (
            <div><dt>Likely shutter</dt><dd>{estimate.label}</dd></div>
          )}
          <div>
            <dt>{camera.name} chose</dt>
            <dd>{camera.cameraDecides.join(' · ')}</dd>
          </div>
        </dl>
        {shot.subject && <p className="muted">{shot.subject}</p>}
      </section>

      <section className="critique">
        <h2>What the scan says</h2>

        {!shot.ai_critique && (
          <>
            <button
              type="button" className="primary"
              onClick={critique} disabled={thinking || !shot.scan_path}
            >
              {thinking ? 'Looking at it…' : 'Critique this frame'}
            </button>
            {!shot.scan_path && <p className="hint">Attach a scan first.</p>}
          </>
        )}

        {error && (
          <>
            <p className="error">{error}</p>
            <button type="button" onClick={critique}>Try again</button>
          </>
        )}

        {shot.ai_critique && (
          <>
            {SECTIONS.map(({ key, label }) => {
              const section = shot.ai_critique![key] as
                { verdict: string; confidence: string; explanation: string };
              return (
                <article key={key} className="critique-section">
                  <h3>
                    {label}
                    <span className={`confidence confidence-${section.confidence}`}>
                      {section.confidence} confidence
                    </span>
                  </h3>
                  <p className="verdict">{section.verdict}</p>
                  <p>{section.explanation}</p>
                </article>
              );
            })}
            <p className="overall">{shot.ai_critique.overall}</p>
            <h3>Next time</h3>
            <ul>
              {shot.ai_critique.next_time.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
            <button type="button" onClick={critique} disabled={thinking}>
              Re-run critique
            </button>
          </>
        )}
      </section>

      <section>
        <h2>Your notes</h2>
        <textarea
          className="text-input notes" rows={4} value={notes}
          onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
          placeholder="What you noticed once you saw it"
          aria-label="Your notes"
        />
      </section>
    </main>
  );
}

function formatValue(value: unknown): string {
  if (value === true) return 'On';
  if (value === false) return 'Off';
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'number') return value > 0 ? `+${value}` : String(value);
  return String(value);
}
