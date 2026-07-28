import { getCamera } from '../cameras';
import { summarise } from './summarise';
import type { Roll, Shot } from '../lib/types';

export function RollSummary({ roll, shots }: { roll: Roll; shots: Shot[] }) {
  const camera = getCamera(roll.camera_id);
  if (shots.length === 0) return null;

  return (
    <section className="control">
      <h2>How you shot this roll</h2>
      {camera.controls.map(control => {
        const tallies = summarise(shots, control.id);
        if (tallies.length === 0) return null;
        return (
          <div key={control.id} className="tally-block">
            <h3>{control.label}</h3>
            {tallies.map(t => (
              <div key={t.value} className="tally">
                <span className="tally-label">{t.value}</span>
                <span className="tally-bar">
                  <span style={{ width: `${Math.round(t.share * 100)}%` }} />
                </span>
                <span className="tally-count">{t.count}</span>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}
