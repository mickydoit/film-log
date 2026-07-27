import { useState } from 'react';
import { PasscodeGate } from './components/PasscodeGate';
import { Shelf } from './screens/Shelf';
import { LoadRoll } from './screens/LoadRoll';
import { LogShot } from './screens/LogShot';
import { RollView } from './screens/RollView';
import { AllRolls } from './screens/AllRolls';
import type { CameraId } from './cameras';
import type { Roll } from './lib/types';

type View =
  | { name: 'shelf' }
  | { name: 'load'; cameraId: CameraId }
  | { name: 'log'; roll: Roll }
  | { name: 'roll'; roll: Roll }
  | { name: 'rolls' };

export default function App() {
  const [view, setView] = useState<View>({ name: 'shelf' });
  const [nonce, setNonce] = useState(0);
  const home = () => { setNonce(n => n + 1); setView({ name: 'shelf' }); };

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
        <RollView roll={view.roll} onBack={home} onOpenFrame={() => {}} />
      )}

      {view.name === 'rolls' && (
        <AllRolls
          onBack={home}
          onOpenRoll={roll => setView({ name: 'roll', roll })}
        />
      )}
    </PasscodeGate>
  );
}
