import { useEffect, useState } from 'react';
import { CAMERAS, type CameraId } from '../cameras';
import { activeRolls } from '../lib/rolls';
import type { Roll } from '../lib/types';
import { pushPullLabel } from './pushPull';
import { queuedCount } from '../lib/queue';

export function Shelf({
  onLogShot, onOpenRoll, onLoadRoll, onBrowseRolls,
}: {
  onLogShot: (roll: Roll) => void;
  onOpenRoll: (roll: Roll) => void;
  onLoadRoll: (cameraId: CameraId) => void;
  onBrowseRolls: () => void;
}) {
  const [rolls, setRolls] = useState<Roll[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    activeRolls().then(setRolls).catch(e => setError(e.message));
  }, []);

  const pending = queuedCount();

  return (
    <main>
      <header className="shelf-head">
        <h1>Film Log</h1>
        <button type="button" className="link" onClick={onBrowseRolls}>
          All rolls
        </button>
      </header>

      {pending > 0 && (
        <p className="badge-warning">
          {pending} shot{pending === 1 ? '' : 's'} waiting to sync
        </p>
      )}
      {error && <p className="error">Could not load rolls: {error}</p>}

      {CAMERAS.map(camera => {
        const roll = rolls?.find(r => r.camera_id === camera.id);
        return (
          <section key={camera.id} className="camera-card">
            <h2>{camera.name}</h2>
            <p className="muted">{camera.lens}</p>

            {error ? (
              // Never imply the camera is empty when we simply could not
              // check — that invites loading a second roll onto loaded film.
              <p className="muted">Couldn't check this camera.</p>
            ) : roll ? (
              <>
                <p className="loaded">
                  {roll.film_stock} @ ISO {roll.iso_set}
                </p>
                {pushPullLabel(roll.box_iso, roll.iso_set) && (
                  <p className="badge-warning">
                    {pushPullLabel(roll.box_iso, roll.iso_set)}
                  </p>
                )}
                <p className="muted">Capacity {roll.frame_capacity} frames</p>
                <div className="card-actions">
                  <button type="button" className="primary" onClick={() => onLogShot(roll)}>
                    Log a shot
                  </button>
                  <button type="button" onClick={() => onOpenRoll(roll)}>
                    Open roll
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="muted">Nothing loaded</p>
                <button type="button" className="primary" onClick={() => onLoadRoll(camera.id)}>
                  Load a roll
                </button>
              </>
            )}
          </section>
        );
      })}
    </main>
  );
}
