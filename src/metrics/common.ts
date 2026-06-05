import type { MetricResult } from '../types.js';

// Starting weights for the scoring model. Color contrast and character
// disambiguation get extra influence because they have the clearest direct
// accessibility impact in the current metric set.
export const METRIC_WEIGHTS = {
  colorContrast: 1.5,
  disambiguation: 1.5,
  xHeight: 1,
  numerals: 1,
  strokeContrast: 1,
} as const;

export function scoreToStatus(
  score: number,
  thresholds: { good: number; fair: number } = { good: 0.7, fair: 0.5 },
): MetricResult['status'] {
  if (score >= thresholds.good) return 'good';
  if (score >= thresholds.fair) return 'fair';
  return 'poor';
}

export function naMetric(id: string, label: string, detail: string, weight = 1): MetricResult {
  return { id, label, value: null, score: null, weight, status: 'na', detail };
}
