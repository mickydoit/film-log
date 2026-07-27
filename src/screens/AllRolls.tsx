import { useEffect, useState } from 'react';
import { listRolls } from '../lib/rolls';
import { getCamera } from '../cameras';
import type { Roll } from '../lib/types';

export function AllRolls({
  onBack, onOpenRoll,
}: {
  onBack: () => void;
  onOpenRoll: (roll: Roll) => void;
}) {
  const [rolls, setRolls] = useState<Roll[]>([]);
  useEffect(() => { listRolls().then(setRolls).catch(() => setRolls([])); }, []);

  return (
    <main>
      <header className="shelf-head">
        <h1>All rolls</h1>
        <button type="button" className="link" onClick={onBack}>Back</button>
      </header>
      {rolls.length === 0 && <p className="muted">No rolls yet.</p>}
      {rolls.map(roll => (
        <button
          key={roll.id} type="button" className="camera-card roll-row"
          onClick={() => onOpenRoll(roll)}
        >
          <strong>{roll.film_stock}</strong>
          <span className="muted">
            {getCamera(roll.camera_id).name} · {roll.status} ·{' '}
            {new Date(roll.loaded_at).toLocaleDateString()}
          </span>
        </button>
      ))}
    </main>
  );
}
