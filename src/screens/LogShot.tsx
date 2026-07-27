import { useEffect, useMemo, useState } from 'react';
import { getCamera, defaultSettings, type Settings } from '../cameras';
import { ControlRenderer } from '../components/controls/ControlRenderer';
import { LightPicker } from '../components/LightPicker';
import { estimateShutter, type LightId } from '../lib/exposure';
import {
  listShots, createShot, nextFrameNumber, isRollFull, lastSettings,
} from '../lib/shots';
import { queueShot } from '../lib/queue';
import type { NewShot, Roll, Shot } from '../lib/types';

export function LogShot({
  roll, onSaved, onCancel,
}: {
  roll: Roll;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const camera = getCamera(roll.camera_id);
  const [shots, setShots] = useState<Shot[] | null>(null);
  const [frame, setFrame] = useState(1);
  const [settings, setSettings] = useState<Settings>(() => defaultSettings(camera));
  const [light, setLight] = useState<LightId | null>(null);
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [queued, setQueued] = useState(false);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    listShots(roll.id)
      .then(existing => {
        setShots(existing);
        setFrame(nextFrameNumber(existing));
        // Consecutive frames usually share settings — carry them forward.
        const previous = lastSettings(existing);
        if (previous) setSettings({ ...defaultSettings(camera), ...previous });
        const previousLight = existing.at(-1)?.light;
        if (previousLight) setLight(previousLight);
      })
      .catch(() => setShots([]));
  }, [roll.id, roll.frame_capacity, camera]);

  const estimate = useMemo(() => {
    if (!camera.estimatesShutter || !light) return null;
    const aperture = settings.aperture;
    if (typeof aperture !== 'string') return null;
    return estimateShutter({
      aperture,
      iso: roll.iso_set,
      light,
      compensationEv: settings.backlight === true ? 1.5 : 0,
    });
  }, [camera.estimatesShutter, light, settings, roll.iso_set]);

  async function save() {
    setSaving(true);
    const payload: NewShot = {
      roll_id: roll.id,
      frame_number: frame,
      settings,
      light,
      subject: subject.trim() || null,
      shot_at: new Date().toISOString(),
    };
    try {
      await createShot(payload);
    } catch {
      // Never lose a frame to a dropped connection.
      if (queueShot(payload)) {
        setQueued(true);
      } else {
        // Storage refused it too. Say so instead of pretending it saved —
        // the user can still write the settings down while standing there.
        setLost(true);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved();
  }

  if (!shots) return <main><p className="muted">Loading roll…</p></main>;

  const full = isRollFull(shots, roll.frame_capacity);

  return (
    <main>
      <header className="shelf-head">
        <h1>{camera.name}</h1>
        <button type="button" className="link" onClick={onCancel}>Done</button>
      </header>

      <p className="muted">
        {roll.film_stock} @ ISO {roll.iso_set} · Frame {frame} of {roll.frame_capacity}
      </p>

      <fieldset className="control">
        <legend>Frame number</legend>
        <input
          className="text-input" type="number" min={1} max={roll.frame_capacity}
          value={frame} onChange={e => setFrame(Number(e.target.value))}
          aria-label="Frame number"
        />
      </fieldset>

      <ControlRenderer controls={camera.controls} value={settings} onChange={setSettings} />

      <LightPicker value={light} onChange={setLight} />

      {estimate && (
        <section className={`estimate ${estimate.outOfRange !== 'none' ? 'estimate-warn' : ''}`}>
          <p className="estimate-label">Likely shutter speed</p>
          <p className="estimate-value">{estimate.label}</p>
          <p className="hint">{estimate.note}</p>
        </section>
      )}

      <fieldset className="control">
        <legend>Subject</legend>
        <input
          className="text-input" value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="so you recognise it later"
          aria-label="Subject"
        />
      </fieldset>

      {queued && <p className="badge-warning">Saved offline — will sync later.</p>}
      {lost && (
        <p className="error">
          Could not save this frame, and offline storage is full or blocked.
          Write these settings down before you leave — they are not stored
          anywhere yet.
        </p>
      )}
      {full && (
        <p className="badge-warning">
          This roll is full — all {roll.frame_capacity} frames are logged.
          Finish it and load a new one.
        </p>
      )}

      <div className="card-actions">
        <button
          type="button" className="primary"
          onClick={save} disabled={saving || full}
        >
          {saving ? 'Saving…' : `Log frame ${frame}`}
        </button>
      </div>

      <p className="muted">
        {camera.name} decides: {camera.cameraDecides.join(' · ')}
      </p>
    </main>
  );
}
