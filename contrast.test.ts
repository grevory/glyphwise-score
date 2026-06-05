import { describe, it, expect } from 'vitest';
import { parseHex, contrastRatio, wcag, isLargeText } from './src/contrast.js';

describe('parseHex', () => {
  it('parses shorthand and full hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex('000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('ignores alpha', () => {
    expect(parseHex('#11223344')).toEqual({ r: 0x11, g: 0x22, b: 0x33 });
  });
  it('throws on invalid input', () => {
    expect(() => parseHex('nope')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('black on white is ~21', () => {
    expect(contrastRatio(parseHex('#000'), parseHex('#fff'))).toBeCloseTo(21, 0);
  });
  it('identical colors are 1', () => {
    expect(contrastRatio(parseHex('#777'), parseHex('#777'))).toBeCloseTo(1, 5);
  });
});

describe('wcag levels', () => {
  it('black/white passes AA and AAA for normal text', () => {
    const r = wcag('#000', '#fff', { fontSizePx: 16 });
    expect(r.aa).toBe(true);
    expect(r.aaa).toBe(true);
  });
});

describe('isLargeText', () => {
  it('applies the bold threshold', () => {
    expect(isLargeText(19, true)).toBe(true);
    expect(isLargeText(19, false)).toBe(false);
    expect(isLargeText(24, false)).toBe(true);
  });
});
