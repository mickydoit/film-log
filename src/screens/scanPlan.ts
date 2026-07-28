export type ScanAssignment = { index: number; frames: number[] };

export type ScanPlan = {
  /** Which frame numbers each file's pieces will be written to. */
  assignments: ScanAssignment[];
  /** How many files will be cut in half. */
  pairs: number;
  /** Total frames that will be written. */
  frames: number;
  /** Pieces that would fall past the end of the roll and will be skipped. */
  dropped: number;
};

/**
 * Work out where each scan will land before anything is uploaded.
 *
 * Pure on purpose: the arithmetic shown to the user in the confirmation must
 * be exactly what the upload loop then does, and uploads overwrite by frame
 * number, so a mistake here silently replaces one photograph with another.
 *
 * A pair that cannot fit BOTH halves is skipped entirely rather than written
 * as one mangled frame.
 */
export function planScans(
  files: { isPair: boolean }[],
  startFrame: number,
  capacity: number,
): ScanPlan {
  const assignments: ScanAssignment[] = [];
  let frame = startFrame;
  let pairs = 0;
  let dropped = 0;

  files.forEach((file, index) => {
    if (file.isPair) {
      if (frame + 1 > capacity) { dropped += 2; return; }
      assignments.push({ index, frames: [frame, frame + 1] });
      frame += 2;
      pairs++;
    } else {
      if (frame > capacity) { dropped += 1; return; }
      assignments.push({ index, frames: [frame] });
      frame += 1;
    }
  });

  return {
    assignments,
    pairs,
    frames: assignments.reduce((n, a) => n + a.frames.length, 0),
    dropped,
  };
}
