import { useState, type ReactNode } from 'react';
import { sha256Hex, expectedHash, UNLOCK_KEY } from '../lib/passcode';

export function PasscodeGate({ children }: { children: ReactNode }) {
  const target = expectedHash();
  const [unlocked, setUnlocked] = useState(
    () => !target || localStorage.getItem(UNLOCK_KEY) === target,
  );
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const hash = await sha256Hex(entry);
    if (hash === target) {
      localStorage.setItem(UNLOCK_KEY, target);
      setUnlocked(true);
    } else {
      setError(true);
      setEntry('');
    }
  }

  return (
    <main className="passcode">
      <h1>Film Log</h1>
      <form onSubmit={submit}>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={entry}
          onChange={e => { setEntry(e.target.value); setError(false); }}
          placeholder="Passcode"
          aria-label="Passcode"
        />
        <button type="submit">Unlock</button>
      </form>
      {error && <p className="error">Not that one.</p>}
    </main>
  );
}
