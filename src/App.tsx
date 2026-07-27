import { useState } from 'react';
import { PasscodeGate } from './components/PasscodeGate';
import { Shelf } from './screens/Shelf';
import { LoadRoll } from './screens/LoadRoll';
import { LogShot } from './screens/LogShot';
import type { CameraId } from './cameras';
import type { Roll } from './lib/types';

type View =
  | { name: 'shelf' }
  | { name: 'load'; cameraId: CameraId }
  | { name: 'log'; roll: Roll };

export default function App() {
  const [view, setView] = useState<View>({ name: 'shelf' });
  // Bumped to force a remount, so a screen refetches its data.
  const [nonce, setNonce] = useState(0);

  return (
    <PasscodeGate>
      {view.name === 'shelf' && (
        <Shelf
          key={nonce}
          onLogShot={roll => setView({ name: 'log', roll })}
          onOpenRoll={() => {}}
          onBrowseRolls={() => {}}
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
        // The nonce key remounts LogShot after each save, so it refetches and
        // lands on the next frame. Logging six frames must not mean six
        // round-trips through the shelf.
        <LogShot
          key={nonce}
          roll={view.roll}
          onSaved={() => setNonce(n => n + 1)}
          onCancel={() => { setNonce(n => n + 1); setView({ name: 'shelf' }); }}
        />
      )}
    </PasscodeGate>
  );
}
