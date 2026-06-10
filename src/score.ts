// Composition: gather metrics, weight the applicable ones, produce 0..100 + grade.

import type {
  FontAccessibilityScore,
  MetricResult,
  OpenTypeFont,
  ScoreContext,
  Grade,
} from './types.js';
import { xHeightMetric } from './metrics/xHeight.js';
import { numeralsMetric } from './metrics/numerals.js';
import { scoreDisambiguation } from './metrics/disambiguation.js';
import { contrastMetric } from './contrast.js';
import { METRIC_WEIGHTS, naMetric } from './metrics/common.js';

export const CAVEATS: string[] = [
  'Heuristic, not a certification. The glyph-legibility metrics are informed estimates, not a validated standard.',
  'The color-contrast metric is standards-based (WCAG 2.x); the glyph metrics are not.',
  'No automated score replaces testing with real users and assistive technology.',
];

export function grade(overall: number): Grade {
  if (overall >= 85) return 'A';
  if (overall >= 70) return 'B';
  if (overall >= 55) return 'C';
  if (overall >= 40) return 'D';
  return 'F';
}

export function composeScore(metrics: MetricResult[]): FontAccessibilityScore {
  const scored = metrics.filter((m) => m.score != null && m.status !== 'na');
  const wsum = scored.reduce((s, m) => s + m.weight, 0) || 1;
  const overall = Math.round(
    (100 * scored.reduce((s, m) => s + (m.score as number) * m.weight, 0)) / wsum,
  );
  return { overall, grade: grade(overall), metrics, caveats: CAVEATS };
}

/**
 * Score a parsed opentype.js font. Pass colors in `ctx` to include contrast,
 * and a `rasterize` function to include character disambiguation.
 */
export function scoreFont(font: OpenTypeFont, ctx: ScoreContext = {}): FontAccessibilityScore {
  const metrics: MetricResult[] = [xHeightMetric(font), numeralsMetric(font)];

  metrics.push(
    ctx.rasterize
      ? scoreDisambiguation(font, ctx.rasterize)
      : naMetric(
          'disambiguation',
          'Character disambiguation',
          'Provide a rasterizer (canvasRasterizer from glyphcheck-score/browser) to enable this metric.',
          METRIC_WEIGHTS.disambiguation,
        ),
  );

  const c = contrastMetric(ctx);
  if (c) metrics.push(c);

  return composeScore(metrics);
}
