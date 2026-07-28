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

/**
 * Persist a shot that could not be sent. Returns false when storage itself
 * refused it (quota exceeded, Safari private mode) — this is the fallback
 * path that exists because saving already failed, so it must never throw and
 * take the app down with it. A false return means the settings are about to
 * be lost and the UI must tell the user to write them down.
 */
export function queueShot(shot: NewShot): boolean {
  try {
    write([...read(), shot]);
    return true;
  } catch {
    return false;
  }
}

export function queuedCount(): number {
  return read().length;
}

/** Guards against overlapping flushes — see flushQueue. */
let inFlight: Promise<number> | null = null;

/**
 * Send queued shots oldest-first. Stops at the first failure and keeps that
 * shot plus everything after it, so frames are never reordered or lost.
 * Returns how many were sent.
 *
 * Concurrency matters here. Flaky signal makes the browser fire `online`
 * repeatedly, and two overlapping flushes would each read the same snapshot
 * and resend the same shots. The second send hits the unique (roll_id,
 * frame_number) constraint, fails, and writes the whole original list back —
 * resurrecting already-synced shots and permanently wedging the queue behind
 * a duplicate that can never succeed. So a flush already in progress is
 * returned rather than started again.
 */
export function flushQueue(
  send: (shot: NewShot) => Promise<unknown>,
): Promise<number> {
  if (inFlight) return inFlight;
  inFlight = runFlush(send).finally(() => { inFlight = null; });
  return inFlight;
}

async function runFlush(
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

  if (sent > 0) {
    // Re-read rather than writing back the snapshot: the user may have logged
    // more shots while this flush was in flight, and those are appended to
    // storage. Dropping the sent prefix off the CURRENT list keeps them.
    try {
      write(read().slice(sent));
    } catch {
      // Storage refused the write. The shots were sent, so the worst case is
      // a retry that the unique constraint rejects — never lost data.
    }
  }

  return sent;
}
