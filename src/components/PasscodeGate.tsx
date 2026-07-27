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
      setEntry('');            // don't keep the plaintext around
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
          // Deliberately no inputMode="numeric": the passcode is whatever the
          // user chose, and forcing a number pad would lock them out of their
          // own app on the phone if it contains a letter.
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
