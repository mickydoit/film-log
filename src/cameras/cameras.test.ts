import { describe, it, expect } from 'vitest';
import { CAMERAS, getCamera, frameCapacity, defaultSettings } from './index';

describe('camera registry', () => {
  it('has both cameras', () => {
    expect(CAMERAS.map(c => c.id).sort()).toEqual(['olympus-xa', 'pentax-17']);
  });

  it('throws on an unknown camera id', () => {
    // @ts-expect-error deliberately invalid
    expect(() => getCamera('nikon-f')).toThrow(/unknown camera/i);
  });
});

describe('olympus xa spec', () => {
  const xa = getCamera('olympus-xa');

  it('is a full-frame camera that estimates its own shutter', () => {
    expect(xa.format).toBe('full');
    expect(xa.estimatesShutter).toBe(true);
  });

  it('offers whole apertures from f/2.8 to f/22', () => {
    const aperture = xa.controls.find(c => c.id === 'aperture');
    expect(aperture).toMatchObject({ type: 'select' });
    expect((aperture as any).values).toEqual([
      'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22',
    ]);
  });

  it('has no shutter control, because the camera chooses it', () => {
    expect(xa.controls.find(c => c.id === 'shutter')).toBeUndefined();
    expect(xa.cameraDecides.join(' ')).toMatch(/shutter/i);
  });

  it('marks 3m as the hyperfocal focus setting', () => {
    const focus = xa.controls.find(c => c.id === 'focus') as any;
    expect(focus.values).toContain('3m (hyperfocal)');
  });

  it('limits film speed to ASA 25-800', () => {
    expect(Math.min(...xa.isoValues)).toBe(25);
    expect(Math.max(...xa.isoValues)).toBe(800);
  });
});

describe('pentax 17 spec', () => {
  const p17 = getCamera('pentax-17');

  it('is half-frame and does not estimate shutter', () => {
    expect(p17.format).toBe('half');
    expect(p17.estimatesShutter).toBe(false);
  });

  it('has all seven mode dial positions', () => {
    const mode = p17.controls.find(c => c.id === 'mode') as any;
    expect(mode.values).toHaveLength(7);
    expect(mode.values).toContain('Full Auto');
    expect(mode.values).toContain('Slow-speed sync');
  });

  it('has six focus zones with official Ricoh ranges', () => {
    const zone = p17.controls.find(c => c.id === 'zone') as any;
    expect(zone.type).toBe('zone');
    expect(zone.values).toHaveLength(6);
    expect(zone.values[0]).toEqual(
      { label: 'Macro', range: '0.24–0.26 m', glyph: 'flower' });
    expect(zone.values[5]).toEqual(
      { label: 'Far', range: '5.1 m – ∞', glyph: 'mountain' });
  });

  it('carries the pictogram printed on the lens barrel for every zone', () => {
    // Flower, cutlery, then one/two/three people, then a mountain — the
    // engraving order on the real barrel, nearest to furthest.
    const zone = p17.controls.find(c => c.id === 'zone') as any;
    expect(zone.values.map((z: any) => z.glyph)).toEqual([
      'flower', 'cutlery', 'person', 'people-two', 'people-three', 'mountain',
    ]);
  });

  it('carries the marking printed on every mode dial position', () => {
    // AUTO, P, BOKEH and B are lettering on the dial; the slow-speed and the
    // two flash positions are symbols.
    const mode = p17.controls.find(c => c.id === 'mode') as any;
    expect(mode.glyphs).toEqual({
      'Full Auto': 'auto',
      'Standard': 'program',
      'Slow-speed': 'moon',
      'Max-aperture (Bokeh)': 'bokeh',
      'Bulb': 'bulb',
      'Daylight sync': 'flash-day',
      'Slow-speed sync': 'flash-slow',
    });
  });

  it('has no aperture control, because the camera chooses it', () => {
    expect(p17.controls.find(c => c.id === 'aperture')).toBeUndefined();
  });

  it('offers exposure compensation in half stops across ±2 EV', () => {
    const comp = p17.controls.find(c => c.id === 'expcomp') as any;
    expect(comp.type).toBe('stops');
    expect(comp.values).toEqual([-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]);
  });

  it('offers the nine ISO dial positions', () => {
    expect(p17.isoValues).toEqual([50, 100, 125, 160, 200, 400, 800, 1600, 3200]);
  });
});

describe('frameCapacity', () => {
  it('gives one frame per exposure on a full-frame camera', () => {
    expect(frameCapacity(getCamera('olympus-xa'), 36)).toBe(36);
  });

  it('doubles the exposures on a half-frame camera', () => {
    expect(frameCapacity(getCamera('pentax-17'), 36)).toBe(72);
    expect(frameCapacity(getCamera('pentax-17'), 24)).toBe(48);
  });
});

describe('defaultSettings', () => {
  it('picks the first value of every control', () => {
    expect(defaultSettings(getCamera('olympus-xa'))).toEqual({
      aperture: 'f/2.8',
      focus: '0.9m',
      backlight: false,
    });
  });

  it('uses zone labels and zero stops as defaults', () => {
    expect(defaultSettings(getCamera('pentax-17'))).toEqual({
      mode: 'Full Auto',
      zone: 'Macro',
      expcomp: 0,
      flash: false,
    });
  });
});
