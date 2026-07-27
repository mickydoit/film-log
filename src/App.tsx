import { useState } from 'react';
import { PasscodeGate } from './components/PasscodeGate';
import { Shelf } from './screens/Shelf';
import { LoadRoll } from './screens/LoadRoll';
import type { CameraId } from './cameras';
import type { Roll } from './lib/types';

type View =
  | { name: 'shelf' }
  | { name: 'load'; cameraId: CameraId };

export default function App() {
  const [view, setView] = useState<View>({ name: 'shelf' });
  const [nonce, setNonce] = useState(0);

  return (
    <PasscodeGate>
      {view.name === 'shelf' && (
        <Shelf
          key={nonce}
          onLogShot={() => {}}
          onOpenRoll={() => {}}
          onBrowseRolls={() => {}}
          onLoadRoll={id => setView({ name: 'load', cameraId: id as CameraId })}
        />
      )}
      {view.name === 'load' && (
        <LoadRoll
          cameraId={view.cameraId}
          onCancel={() => setView({ name: 'shelf' })}
          onDone={(_roll: Roll) => { setNonce(n => n + 1); setView({ name: 'shelf' }); }}
        />
      )}
    </PasscodeGate>
  );
}
