import { describe, it, expect } from 'vitest';
import { pushPullLabel } from './pushPull';

describe('pushPullLabel', () => {
  it('says nothing when the film is shot at box speed', () => {
    expect(pushPullLabel(200, 200)).toBeNull();
  });

  it('describes a one stop push', () => {
    expect(pushPullLabel(200, 400)).toBe('Pushed 1 stop — tell the lab.');
  });

  it('describes a two stop push', () => {
    expect(pushPullLabel(400, 1600)).toBe('Pushed 2 stops — tell the lab.');
  });

  it('describes a one stop pull', () => {
    expect(pushPullLabel(400, 200)).toBe('Pulled 1 stop — tell the lab.');
  });

  it('handles fractional stops', () => {
    expect(pushPullLabel(100, 125)).toBe('Pushed ⅓ stop — tell the lab.');
  });

  it('names the exact fraction rather than just mentioning the lab', () => {
    expect(pushPullLabel(100, 160)).toBe('Pushed ⅔ stop — tell the lab.');
  });

  it('reads whole-plus-fraction pushes the way a lab would say them', () => {
    // Box 125 film dialled to 400 on the Pentax 17 — 1.678 stops.
    expect(pushPullLabel(125, 400)).toBe('Pushed 1⅔ stops — tell the lab.');
    // Box 160 dialled to 400 — 1.322 stops.
    expect(pushPullLabel(160, 400)).toBe('Pushed 1⅓ stops — tell the lab.');
  });

  it('says nothing when two speeds differ by a hair', () => {
    // Not a push — just a box speed typed slightly off.
    expect(pushPullLabel(195, 200)).toBeNull();
  });
});
