import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueShot, queuedCount, flushQueue, QUEUE_KEY } from './queue';

const shot = {
  roll_id: 'r1',
  frame_number: 3,
  settings: { aperture: 'f/8' },
  light: 'overcast' as const,
  subject: 'gum tree',
  shot_at: '2026-07-27T04:00:00.000Z',
};

describe('offline queue', () => {
  beforeEach(() => {
    // Set up localStorage mock
    const store: { [key: string]: string } = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => {
          delete store[key];
        });
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      length: Object.keys(store).length,
    });

    vi.restoreAllMocks();
  });

  it('starts empty', () => {
    expect(queuedCount()).toBe(0);
  });

  it('stores a shot that could not be sent', () => {
    expect(queueShot(shot)).toBe(true);
    expect(queuedCount()).toBe(1);
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY)!)).toHaveLength(1);
  });

  it('keeps queued shots in the order they were taken', () => {
    expect(queueShot(shot)).toBe(true);
    expect(queueShot({ ...shot, frame_number: 4 })).toBe(true);
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY)!);
    expect(stored.map((s: any) => s.frame_number)).toEqual([3, 4]);
  });

  it('empties the queue when every shot sends successfully', async () => {
    expect(queueShot(shot)).toBe(true);
    expect(queueShot({ ...shot, frame_number: 4 })).toBe(true);
    const send = vi.fn().mockResolvedValue(undefined);

    const sent = await flushQueue(send);

    expect(sent).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(queuedCount()).toBe(0);
  });

  it('keeps the failing shot and everything after it', async () => {
    expect(queueShot(shot)).toBe(true);
    expect(queueShot({ ...shot, frame_number: 4 })).toBe(true);
    expect(queueShot({ ...shot, frame_number: 5 })).toBe(true);
    const send = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('offline'));

    const sent = await flushQueue(send);

    expect(sent).toBe(1);
    expect(queuedCount()).toBe(2);
    const remaining = JSON.parse(localStorage.getItem(QUEUE_KEY)!);
    expect(remaining.map((s: any) => s.frame_number)).toEqual([4, 5]);
  });

  it('survives corrupted storage rather than crashing the app', () => {
    localStorage.setItem(QUEUE_KEY, 'not json');
    expect(queuedCount()).toBe(0);
  });

  it('does not start a second flush while one is already running', async () => {
    expect(queueShot(shot)).toBe(true);
    expect(queueShot({ ...shot, frame_number: 4 })).toBe(true);
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const send = vi.fn().mockImplementation(async () => { await gate; });

    const first = flushQueue(send);
    const second = flushQueue(send);
    release();
    const [a, b] = await Promise.all([first, second]);

    // The second call joins the first rather than resending anything.
    expect(send).toHaveBeenCalledTimes(2);
    expect(a).toBe(2);
    expect(b).toBe(2);
    expect(queuedCount()).toBe(0);
  });

  it('keeps a shot logged while a flush was in progress', async () => {
    expect(queueShot(shot)).toBe(true);
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const send = vi.fn().mockImplementation(async () => { await gate; });

    const flushing = flushQueue(send);
    expect(queueShot({ ...shot, frame_number: 9 })).toBe(true);   // logged mid-flush
    release();
    await flushing;

    const remaining = JSON.parse(localStorage.getItem(QUEUE_KEY)!);
    expect(remaining.map((s: any) => s.frame_number)).toEqual([9]);
  });

  it('reports failure instead of throwing when storage refuses the write', () => {
    // Adapt to our vi.stubGlobal localStorage: spy on the setItem we created
    const store: { [key: string]: string } = {};
    const setItemFn = vi.fn((key: string, value: string) => {
      throw new Error('QuotaExceededError');
    });

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: setItemFn,
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => {
          delete store[key];
        });
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      length: Object.keys(store).length,
    });

    expect(() => queueShot(shot)).not.toThrow();
    expect(queueShot(shot)).toBe(false);
  });

  it('reports success when the shot is stored', () => {
    expect(queueShot(shot)).toBe(true);
  });
});
