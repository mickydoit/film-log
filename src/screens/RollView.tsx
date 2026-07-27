import { useCallback, useEffect, useState } from 'react';
import { getCamera } from '../cameras';
import { listShots, createShot, updateShot } from '../lib/shots';
import { updateRoll } from '../lib/rolls';
import { uploadScan, signedScanUrl } from '../lib/scans';
import { splitImage, looksLikeFramePair, loadImage } from '../lib/halfFrame';
import type { Roll, RollStatus, Shot } from '../lib/types';

const STATUSES: RollStatus[] = ['shooting', 'finished', 'developing', 'scanned'];

/** How many of these files look like side-by-side half-frame pairs. */
async function countLikelyPairs(files: File[]): Promise<number> {
  let pairs = 0;
  for (const file of files) {
    try {
      const img = await loadImage(file);
      if (looksLikeFramePair(img.naturalWidth, img.naturalHeight)) pairs++;
    } catch {
      // Unreadable files are reported later, during the upload pass.
    }
  }
  return pairs;
}

export function RollView({
  roll, onBack, onOpenFrame,
}: {
  roll: Roll;
  onBack: () => void;
  onOpenFrame: (shot: Shot) => void;
}) {
  const camera = getCamera(roll.camera_id);
  const [shots, setShots] = useState<Shot[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<RollStatus>(roll.status);
  const [busy, setBusy] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);
  const [splitPairs, setSplitPairs] = useState(camera.format === 'half');

  const refresh = useCallback(async () => {
    const loaded = await listShots(roll.id);
    setShots(loaded);
    const urls: Record<string, string> = {};
    await Promise.all(
      loaded.filter(s => s.scan_path).map(async s => {
        urls[s.id] = await signedScanUrl(s.scan_path!);
      }),
    );
    setThumbs(urls);
  }, [roll.id]);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Scans arrive as a folder of files. On a half-frame roll each file usually
   * holds two frames side by side, so it is cut in half and the pieces are
   * assigned to consecutive frame numbers.
   *
   * Aspect ratio alone CANNOT prove a file is a pair. A genuine pair of
   * portrait half-frames is about 1.42 wide; a single half-frame that the lab
   * rotated because the shot was taken with the camera turned on its side is
   * about 1.41. They are indistinguishable. Splitting a rotated single cuts
   * the photograph in half, so the count is confirmed with the user first
   * rather than assumed — they can see whether the arithmetic matches the
   * roll they actually shot.
   */
  async function handleFiles(files: FileList) {
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
    setFailures([]);

    if (splitPairs) {
      const pairs = await countLikelyPairs(sorted);
      const frames = pairs * 2 + (sorted.length - pairs);
      const ok = window.confirm(
        `${sorted.length} file${sorted.length === 1 ? '' : 's'} → ${frames} frames.\n\n` +
        `${pairs} look like side-by-side pairs and will be split in half.\n\n` +
        `If you turned the camera on its side for any of these, the lab may have ` +
        `rotated them, and splitting would cut the photo in half. Cancel and ` +
        `untick "each file holds two half-frames" if that is the case.`,
      );
      if (!ok) return;
    }

    let frame = 1;

    for (const file of sorted) {
      setBusy(file.name);
      try {
        const img = await loadImage(file);
        const isPair =
          splitPairs && looksLikeFramePair(img.naturalWidth, img.naturalHeight);
        const pieces: Blob[] = isPair ? await splitImage(file) : [file];

        for (const piece of pieces) {
          if (frame > roll.frame_capacity) break;
          const path = await uploadScan(roll.id, frame, piece);
          const existing = shots.find(s => s.frame_number === frame);
          if (existing) {
            await updateShot(existing.id, { scan_path: path });
          } else {
            // A frame that was shot but never logged still deserves its scan.
            const made = await createShot({
              roll_id: roll.id, frame_number: frame, settings: {},
              light: null, subject: null,
              shot_at: new Date().toISOString(),
            });
            await updateShot(made.id, { scan_path: path });
          }
          frame++;
        }
      } catch (e) {
        // Report rather than swallow — a silently missing scan is worse than
        // a visible failure, because you would not know to re-upload it.
        setFailures(prev => [...prev, `${file.name}: ${(e as Error).message}`]);
      }
    }

    setBusy(null);
    if (status !== 'scanned') { await changeStatus('scanned'); }
    await refresh();
  }

  async function changeStatus(next: RollStatus) {
    setStatus(next);
    await updateRoll(roll.id, {
      status: next,
      ...(next === 'finished' ? { finished_at: new Date().toISOString() } : {}),
    });
  }

  return (
    <main>
      <header className="shelf-head">
        <h1>{roll.film_stock}</h1>
        <button type="button" className="link" onClick={onBack}>Back</button>
      </header>
      <p className="muted">
        {camera.name} · ISO {roll.iso_set} · {shots.length}/{roll.frame_capacity} logged
      </p>

      <fieldset className="control">
        <legend>Status</legend>
        <div className="option-row">
          {STATUSES.map(s => (
            <button
              key={s} type="button" className="option"
              aria-pressed={s === status}
              onClick={() => changeStatus(s)}
            >
              <span className="option-label">{s}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="control">
        <legend>Scans</legend>
        <label
          className="dropzone"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <input
            type="file" accept="image/*" multiple hidden
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
          {busy ? `Uploading ${busy}…` : 'Drop your scans here, or tap to choose'}
        </label>
        {failures.length > 0 && (
          <div className="error">
            <p>These files did not upload — try them again:</p>
            <ul>{failures.map(f => <li key={f}>{f}</li>)}</ul>
          </div>
        )}
        {camera.format === 'half' && (
          <label className="checkline">
            <input
              type="checkbox" checked={splitPairs}
              onChange={e => setSplitPairs(e.target.checked)}
            />
            Each file holds two half-frames — split them
          </label>
        )}
      </fieldset>

      <div className="frame-grid">
        {Array.from({ length: roll.frame_capacity }, (_, i) => i + 1).map(n => {
          const shot = shots.find(s => s.frame_number === n);
          return (
            <button
              key={n} type="button"
              className={`frame ${shot ? 'frame-logged' : ''}`}
              onClick={() => shot && onOpenFrame(shot)}
              disabled={!shot}
            >
              {shot && thumbs[shot.id]
                ? <img src={thumbs[shot.id]} alt={`Frame ${n}`} />
                : <span className="frame-number">{n}</span>}
            </button>
          );
        })}
      </div>
    </main>
  );
}
