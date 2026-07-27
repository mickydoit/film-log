import type { NewShot } from './types';

export const QUEUE_KEY = 'film-log:pending-shots';

function read(): NewShot[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupted storage must never stop the user logging a shot.
    return [];
  }
}

function write(shots: NewShot[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(shots));
}

export function queueShot(shot: NewShot): void {
  write([...read(), shot]);
}

export function queuedCount(): number {
  return read().length;
}

/**
 * Send queued shots oldest-first. Stops at the first failure and keeps that
 * shot plus everything after it, so frames are never reordered or lost.
 * Returns how many were sent.
 */
export async function flushQueue(
  send: (shot: NewShot) => Promise<unknown>,
): Promise<number> {
  const pending = read();
  let sent = 0;

  for (const shot of pending) {
    try {
      await send(shot);
      sent++;
    } catch {
      break;
    }
  }

  write(pending.slice(sent));
  return sent;
}
