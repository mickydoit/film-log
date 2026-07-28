import { describe, it, expect } from 'vitest';
import { formatValue } from './FrameDetail';

describe('formatValue', () => {
  it('renders zero compensation as a number, not a blank', () => {
    // "0" means the user deliberately used no compensation — that is
    // information, and an em-dash would read as "not recorded".
    expect(formatValue(0)).toBe('0');
  });

  it('signs positive compensation', () => {
    expect(formatValue(1.5)).toBe('+1.5');
  });

  it('leaves negative compensation as it is', () => {
    expect(formatValue(-1)).toBe('-1');
  });

  it('renders toggles as On and Off', () => {
    expect(formatValue(true)).toBe('On');
    expect(formatValue(false)).toBe('Off');
  });

  it('marks genuinely missing values with an em-dash', () => {
    expect(formatValue(null)).toBe('—');
    expect(formatValue(undefined)).toBe('—');
    expect(formatValue('')).toBe('—');
  });

  it('passes strings through', () => {
    expect(formatValue('f/8')).toBe('f/8');
  });
});
