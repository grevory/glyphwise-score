import { describe, it, expect } from 'vitest';
import { glyphDifference } from './src/metrics/disambiguation.js';
import { numeralsInfo } from './src/metrics/numerals.js';
import { composeScore, grade } from './src/score.js';
import type { Bitmap, MetricResult } from './src/types.js';

function bmp(size: number, fill: (i: number) => number): Bitmap {
  const data = new Float32Array(size * size);
  for (let i = 0; i < data.length; i++) data[i] = fill(i);
  return { size, data };
}

describe('glyphDifference', () => {
  it('is 0 for identical bitmaps', () => {
    const a = bmp(4, (i) => (i % 2 ? 1 : 0));
    expect(glyphDifference(a, a)).toBe(0);
  });
  it('is 1 for fully disjoint bitmaps', () => {
    const a = bmp(4, (i) => (i < 8 ? 1 : 0));
    const b = bmp(4, (i) => (i >= 8 ? 1 : 0));
    expect(glyphDifference(a, b)).toBeCloseTo(1, 5);
  });
  it('throws on size mismatch', () => {
    expect(() =>
      glyphDifference(
        bmp(4, () => 0),
        bmp(2, () => 0),
      ),
    ).toThrow();
  });
});

// Minimal mock font exercising the small opentype.js surface numeralsInfo uses.
function mockFont(advanceWidths: number[], featureTags: string[]) {
  return {
    tables: { gsub: { features: featureTags.map((tag) => ({ tag })) } },
    charToGlyph: (ch: string) => {
      const d = Number(ch);
      return Number.isInteger(d) ? { advanceWidth: advanceWidths[d] } : { advanceWidth: 500 };
    },
  };
}

describe('numeralsInfo', () => {
  it('detects tabular-by-default when digit widths are equal', () => {
    const info = numeralsInfo(mockFont(Array(10).fill(600), []));
    expect(info.tabularByDefault).toBe(true);
  });
  it('detects proportional figures and tnum availability', () => {
    const widths = [600, 500, 580, 590, 585, 588, 590, 575, 592, 591];
    const info = numeralsInfo(mockFont(widths, ['tnum', 'zero']));
    expect(info.tabularByDefault).toBe(false);
    expect(info.hasTnum).toBe(true);
    expect(info.hasZero).toBe(true);
  });
});

describe('composeScore', () => {
  it('ignores n/a metrics and grades the weighted average', () => {
    const metrics: MetricResult[] = [
      { id: 'a', label: 'A', value: 1, score: 1, weight: 1, status: 'good', detail: '' },
      { id: 'b', label: 'B', value: 1, score: 0.5, weight: 1, status: 'fair', detail: '' },
      { id: 'c', label: 'C', value: null, score: null, weight: 5, status: 'na', detail: '' },
    ];
    const result = composeScore(metrics);
    expect(result.overall).toBe(75); // (1 + 0.5) / 2 * 100
    expect(result.grade).toBe('B');
  });
});

describe('grade', () => {
  it('maps thresholds', () => {
    expect(grade(90)).toBe('A');
    expect(grade(60)).toBe('C');
    expect(grade(10)).toBe('F');
  });
});
