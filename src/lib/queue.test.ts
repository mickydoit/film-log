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
    queueShot(shot);
    expect(queuedCount()).toBe(1);
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY)!)).toHaveLength(1);
  });

  it('keeps queued shots in the order they were taken', () => {
    queueShot(shot);
    queueShot({ ...shot, frame_number: 4 });
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY)!);
    expect(stored.map((s: any) => s.frame_number)).toEqual([3, 4]);
  });

  it('empties the queue when every shot sends successfully', async () => {
    queueShot(shot);
    queueShot({ ...shot, frame_number: 4 });
    const send = vi.fn().mockResolvedValue(undefined);

    const sent = await flushQueue(send);

    expect(sent).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(queuedCount()).toBe(0);
  });

  it('keeps the failing shot and everything after it', async () => {
    queueShot(shot);
    queueShot({ ...shot, frame_number: 4 });
    queueShot({ ...shot, frame_number: 5 });
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
});
