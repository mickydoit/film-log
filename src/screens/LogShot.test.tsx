import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogShot } from './LogShot';
import type { Roll, Shot } from '../lib/types';

vi.mock('../lib/shots', async () => {
  const actual = await vi.importActual<typeof import('../lib/shots')>('../lib/shots');
  return { ...actual, listShots: vi.fn(), createShot: vi.fn() };
});

import { listShots, createShot } from '../lib/shots';

const xaRoll: Roll = {
  id: 'r1', camera_id: 'olympus-xa', film_stock: 'Kodak Gold 200',
  box_iso: 200, iso_set: 200, exposures: 36, frame_capacity: 36,
  status: 'shooting', loaded_at: '2026-07-01T00:00:00Z',
  finished_at: null, lab: null, dev_notes: null,
  created_at: '2026-07-01T00:00:00Z',
};

const shot = (n: number, settings: Record<string, unknown>): Shot => ({
  id: `s${n}`, roll_id: 'r1', frame_number: n, settings: settings as any,
  light: 'overcast', shot_at: '2026-07-01T00:00:00Z', subject: null,
  scan_path: null, ai_critique: null, my_notes: null,
  created_at: '2026-07-01T00:00:00Z',
});

describe('LogShot', () => {
  beforeEach(() => {
    vi.mocked(listShots).mockReset();
    vi.mocked(createShot).mockReset().mockResolvedValue(shot(1, {}));
    localStorage.clear();
  });

  it('starts a fresh roll at frame 1', async () => {
    vi.mocked(listShots).mockResolvedValue([]);
    render(<LogShot roll={xaRoll} onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(await screen.findByText(/frame 1 of 36/i)).toBeInTheDocument();
  });

  it('advances to the next frame number', async () => {
    vi.mocked(listShots).mockResolvedValue([shot(1, {}), shot(2, {})]);
    render(<LogShot roll={xaRoll} onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(await screen.findByText(/frame 3 of 36/i)).toBeInTheDocument();
  });

  it('refuses to log past the end of the roll', async () => {
    // A 36-frame roll with 36 frames logged has nowhere left to go. Offering
    // frame 36 again would fail on the unique constraint with no explanation.
    vi.mocked(listShots).mockResolvedValue(
      Array.from({ length: 36 }, (_, i) => shot(i + 1, {})),
    );
    render(<LogShot roll={xaRoll} onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(await screen.findByText(/roll is full/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^log frame/i })).toBeDisabled();
  });

  it('pre-fills the settings from the previous frame', async () => {
    vi.mocked(listShots).mockResolvedValue([
      shot(1, { aperture: 'f/11', focus: '3m (hyperfocal)', backlight: false }),
    ]);
    render(<LogShot roll={xaRoll} onSaved={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'f/11' }))
        .toHaveAttribute('aria-pressed', 'true'),
    );
  });

  it('shows the estimated shutter speed for the XA', async () => {
    vi.mocked(listShots).mockResolvedValue([
      shot(1, { aperture: 'f/16', focus: '∞', backlight: false }),
    ]);
    // Sunny 16 (f/16, bright sun) gives the classic 1/125 at ISO 100 — see
    // exposure.test.ts. xaRoll is ISO 200, which correctly estimates 1/250
    // instead (a half-stop faster, per the same math), so this test uses its
    // own ISO 100 roll to check the specific classic value.
    const iso100Roll: Roll = { ...xaRoll, iso_set: 100, box_iso: 100 };
    render(<LogShot roll={iso100Roll} onSaved={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /bright sun/i }));
    expect(await screen.findByText('1/125')).toBeInTheDocument();
  });

  it('warns about camera shake at slow estimated speeds', async () => {
    vi.mocked(listShots).mockResolvedValue([
      shot(1, { aperture: 'f/8', focus: '2m', backlight: false }),
    ]);
    render(<LogShot roll={xaRoll} onSaved={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /indoors/i }));
    expect(await screen.findByText(/shake/i)).toBeInTheDocument();
  });

  it('saves the frame with its settings and light', async () => {
    vi.mocked(listShots).mockResolvedValue([]);
    const onSaved = vi.fn();
    render(<LogShot roll={xaRoll} onSaved={onSaved} onCancel={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'f/8' }));
    await userEvent.click(screen.getByRole('button', { name: /overcast/i }));
    await userEvent.click(screen.getByRole('button', { name: /^log frame/i }));

    await waitFor(() => expect(createShot).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createShot).mock.calls[0][0]).toMatchObject({
      roll_id: 'r1',
      frame_number: 1,
      light: 'overcast',
      settings: expect.objectContaining({ aperture: 'f/8' }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('queues the frame instead of losing it when the save fails', async () => {
    vi.mocked(listShots).mockResolvedValue([]);
    vi.mocked(createShot).mockRejectedValue(new Error('offline'));
    const onSaved = vi.fn();
    render(<LogShot roll={xaRoll} onSaved={onSaved} onCancel={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: /overcast/i }));
    await userEvent.click(screen.getByRole('button', { name: /^log frame/i }));

    await waitFor(() =>
      expect(localStorage.getItem('film-log:pending-shots')).toContain('"frame_number":1'),
    );
    expect(onSaved).toHaveBeenCalled();
  });
});
