// x-height relative to cap height. Higher x-height generally improves
// legibility at small sizes (to a point). HEURISTIC.

import type { OpenTypeFont, MetricResult } from '../types.js';
import { METRIC_WEIGHTS, naMetric, scoreToStatus } from './common.js';

function glyphTop(font: OpenTypeFont, ch: string): number {
  try {
    const g = font.charToGlyph(ch);
    const bb = g?.getBoundingBox?.();
    return bb ? bb.y2 : 0;
  } catch {
    return 0;
  }
}

export function xHeightRatio(
  font: OpenTypeFont,
): { xHeight: number; capHeight: number; ratio: number } | null {
  const os2 = font.tables?.os2;
  const xh = os2?.sxHeight && os2.sxHeight > 0 ? os2.sxHeight : glyphTop(font, 'x');
  const cap = os2?.sCapHeight && os2.sCapHeight > 0 ? os2.sCapHeight : glyphTop(font, 'H');
  if (!xh || !cap) return null;
  return { xHeight: xh, capHeight: cap, ratio: xh / cap };
}

function ratioToScore(r: number): number {
  if (r >= 0.62 && r <= 0.76) return 0.9;
  if (r > 0.76) return 0.8; // very tall x-heights can crowd ascenders
  if (r >= 0.55) return 0.75;
  if (r >= 0.48) return 0.6;
  return 0.45;
}

export function xHeightMetric(font: OpenTypeFont): MetricResult {
  const r = xHeightRatio(font);
  if (!r) {
    return naMetric(
      'xHeight',
      'x-height ratio',
      'Could not determine x-height or cap height from this font.',
      METRIC_WEIGHTS.xHeight,
    );
  }
  const score = ratioToScore(r.ratio);
  const status = scoreToStatus(score, { good: 0.75, fair: 0.6 });
  return {
    id: 'xHeight',
    label: 'x-height ratio',
    value: Number(r.ratio.toFixed(3)),
    score,
    weight: METRIC_WEIGHTS.xHeight,
    status,
    detail:
      `x-height is ${(r.ratio * 100).toFixed(0)}% of cap height. ` +
      'Larger x-heights tend to read better at small sizes; extremely large ones can reduce ascender/descender distinction.',
  };
}
