import { useEffect, useState } from 'react';
import { PasscodeGate } from './components/PasscodeGate';
import { Shelf } from './screens/Shelf';
import { LoadRoll } from './screens/LoadRoll';
import { LogShot } from './screens/LogShot';
import { RollView } from './screens/RollView';
import { AllRolls } from './screens/AllRolls';
import { FrameDetail } from './screens/FrameDetail';
import { flushQueue } from './lib/queue';
import { createShot } from './lib/shots';
import type { CameraId } from './cameras';
import type { Roll, Shot } from './lib/types';

type View =
  | { name: 'shelf' }
  | { name: 'load'; cameraId: CameraId }
  | { name: 'log'; roll: Roll }
  | { name: 'roll'; roll: Roll }
  | { name: 'rolls' }
  | { name: 'frame'; shot: Shot; roll: Roll };

export default function App() {
  const [view, setView] = useState<View>({ name: 'shelf' });
  const [nonce, setNonce] = useState(0);
  const home = () => { setNonce(n => n + 1); setView({ name: 'shelf' }); };

  // Shots logged while offline are sent as soon as there is a connection again.
  useEffect(() => {
    const flush = () => {
      flushQueue(shot => createShot(shot))
        .then(sent => { if (sent > 0) setNonce(n => n + 1); })
        .catch(() => {});
    };
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  return (
    <PasscodeGate>
      {view.name === 'shelf' && (
        <Shelf
          key={nonce}
          onLogShot={roll => setView({ name: 'log', roll })}
          onOpenRoll={roll => setView({ name: 'roll', roll })}
          onBrowseRolls={() => setView({ name: 'rolls' })}
          onLoadRoll={cameraId => setView({ name: 'load', cameraId })}
        />
      )}

      {view.name === 'load' && (
        <LoadRoll
          cameraId={view.cameraId}
          onCancel={() => setView({ name: 'shelf' })}
          onDone={roll => { setNonce(n => n + 1); setView({ name: 'log', roll }); }}
        />
      )}

      {view.name === 'log' && (
        <LogShot
          key={nonce}
          roll={view.roll}
          onSaved={() => setNonce(n => n + 1)}
          onCancel={home}
        />
      )}

      {view.name === 'roll' && (
        <RollView
          key={nonce}
          roll={view.roll}
          onBack={home}
          onOpenFrame={shot => setView({ name: 'frame', shot, roll: (view as { roll: Roll }).roll })}
        />
      )}

      {view.name === 'rolls' && (
        <AllRolls
          onBack={home}
          onOpenRoll={roll => setView({ name: 'roll', roll })}
        />
      )}

      {view.name === 'frame' && (
        <FrameDetail
          shot={view.shot}
          roll={view.roll}
          onBack={() => setView({ name: 'roll', roll: view.roll })}
        />
      )}
    </PasscodeGate>
  );
}
