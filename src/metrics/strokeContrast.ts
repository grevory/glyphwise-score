// Stroke contrast (thick/thin modulation). High contrast (fine hairlines)
// reduces legibility at small sizes and for low-vision readers.
//
// STUB — not yet implemented. See README "Tasks for Claude Code".
// Suggested approach: for a reference glyph (e.g. 'o' or 'H'), walk the inner
// and outer outlines from opentype.js and sample stroke thickness at many
// points; report the ratio of thickest to thinnest stroke.

import type { OpenTypeFont, MetricResult } from '../types.js';
import { METRIC_WEIGHTS, naMetric } from './common.js';

export function strokeContrastMetric(_font: OpenTypeFont): MetricResult {
  return naMetric(
    'strokeContrast',
    'Stroke contrast',
    'Not yet implemented. TODO: measure the ratio of thickest to thinnest stroke from glyph outlines. ' +
      'Very high contrast (thin hairlines) hurts legibility at small sizes.',
    METRIC_WEIGHTS.strokeContrast,
  );
}
