import { describe, it, expect } from 'vitest';
import { parseAperture, estimateShutter, LIGHTS } from './exposure';

describe('LIGHTS', () => {
  it('defines the six light conditions in descending brightness', () => {
    expect(LIGHTS.map(l => l.id)).toEqual([
      'bright-sun', 'hazy-sun', 'overcast', 'open-shade', 'indoors', 'night',
    ]);
    const evs = LIGHTS.map(l => l.ev100);
    expect(evs).toEqual([...evs].sort((a, b) => b - a));
  });
});

describe('parseAperture', () => {
  it('reads the f-number out of a label', () => {
    expect(parseAperture('f/2.8')).toBeCloseTo(2.8);
    expect(parseAperture('f/16')).toBe(16);
  });

  it('rejects nonsense', () => {
    expect(() => parseAperture('wide open')).toThrow(/aperture/i);
  });
});

describe('estimateShutter', () => {
  it('reproduces the Sunny 16 rule', () => {
    // f/16, bright sun, ISO 100 -> the classic 1/125.
    const est = estimateShutter({ aperture: 'f/16', iso: 100, light: 'bright-sun' });
    expect(est.label).toBe('1/125');
    expect(est.outOfRange).toBe('none');
    expect(est.shakeRisk).toBe(false);
  });

  it('matches the worked example from the spec', () => {
    // f/2.8, indoors (EV100 8), ISO 400 -> EV 10 -> 7.84/1024 = 1/131 -> 1/125.
    const est = estimateShutter({ aperture: 'f/2.8', iso: 400, light: 'indoors' });
    expect(est.label).toBe('1/125');
  });

  it('gets one stop slower for each stop the aperture closes', () => {
    const wide = estimateShutter({ aperture: 'f/8', iso: 100, light: 'overcast' });
    const narrow = estimateShutter({ aperture: 'f/11', iso: 100, light: 'overcast' });
    expect(narrow.seconds).toBeGreaterThan(wide.seconds);
    // f/8 to f/11 is one stop, so narrow should be approximately 2x wider (longer exposure).
    // Allow tolerance for discrete shutter speed quantization.
    expect(narrow.seconds / wide.seconds).toBeCloseTo(2, 0);
  });

  it('gets faster as film speed increases', () => {
    const slow = estimateShutter({ aperture: 'f/8', iso: 100, light: 'overcast' });
    const fast = estimateShutter({ aperture: 'f/8', iso: 400, light: 'overcast' });
    expect(fast.seconds).toBeLessThan(slow.seconds);
  });

  it('warns about camera shake below 1/30', () => {
    const est = estimateShutter({ aperture: 'f/8', iso: 100, light: 'indoors' });
    expect(est.shakeRisk).toBe(true);
    expect(est.note).toMatch(/shake|tripod|brace/i);
  });

  it('flags scenes brighter than the XA can handle', () => {
    // f/2.8 in bright sun on ISO 800 needs far more than 1/500.
    const est = estimateShutter({ aperture: 'f/2.8', iso: 800, light: 'bright-sun' });
    expect(est.outOfRange).toBe('too-bright');
    expect(est.label).toBe('1/500');
    expect(est.note).toMatch(/overexpos/i);
  });

  it('flags scenes darker than the XA can handle', () => {
    const est = estimateShutter({ aperture: 'f/22', iso: 25, light: 'night' });
    expect(est.outOfRange).toBe('too-dark');
    expect(est.label).toBe('10s');
    expect(est.note).toMatch(/underexpos/i);
  });

  it('applies exposure compensation in stops', () => {
    const base = estimateShutter({ aperture: 'f/8', iso: 100, light: 'bright-sun' });
    const plusOne = estimateShutter({
      aperture: 'f/8', iso: 100, light: 'bright-sun', compensationEv: 1,
    });
    // +1 EV of compensation means more light, so a slower shutter: 2x the time.
    expect(plusOne.seconds).toBeCloseTo(base.seconds * 2, 5);
  });

  it('labels sub-second and multi-second speeds differently', () => {
    expect(estimateShutter({ aperture: 'f/16', iso: 100, light: 'bright-sun' }).label)
      .toMatch(/^1\//);
    expect(estimateShutter({ aperture: 'f/22', iso: 25, light: 'night' }).label)
      .toMatch(/s$/);
  });

  it('treats Sunny 16 on faster film as correctly exposed, not overexposed', () => {
    // f/16, bright sun, ISO 400 lands 0.03 stops past 1/500 — the textbook
    // "extend Sunny 16 for the film speed" case, not an error.
    const est = estimateShutter({ aperture: 'f/16', iso: 400, light: 'bright-sun' });
    expect(est.label).toBe('1/500');
    expect(est.outOfRange).toBe('none');
  });

  it('still flags a scene genuinely beyond the fastest shutter', () => {
    const est = estimateShutter({ aperture: 'f/2.8', iso: 800, light: 'bright-sun' });
    expect(est.outOfRange).toBe('too-bright');
  });

  it('flags camera shake at exactly 1/30', () => {
    // f/4, indoors, ISO 200 -> EV 9 -> 1/32 -> snaps to 1/30.
    const est = estimateShutter({ aperture: 'f/4', iso: 200, light: 'indoors' });
    expect(est.label).toBe('1/30');
    expect(est.shakeRisk).toBe(true);
  });

  it('does not flag shake at 1/60', () => {
    const est = estimateShutter({ aperture: 'f/2.8', iso: 200, light: 'indoors' });
    expect(est.label).toBe('1/60');
    expect(est.shakeRisk).toBe(false);
  });
});
