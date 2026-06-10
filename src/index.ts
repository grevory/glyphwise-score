// glyphcheck-score — heuristic accessibility/legibility scoring for fonts.

export type {
  MetricStatus,
  MetricResult,
  RGB,
  ScoreContext,
  GlyphRasterizer,
  Bitmap,
  Grade,
  FontAccessibilityScore,
  OpenTypeFont,
} from './types.js';

export { scoreFont, composeScore, grade, CAVEATS } from './score.js';

export {
  parseHex,
  relativeLuminance,
  contrastRatio,
  isLargeText,
  wcag,
  apcaLc,
  contrastMetric,
} from './contrast.js';

export { xHeightRatio, xHeightMetric } from './metrics/xHeight.js';
export {
  gsubFeatureTags,
  digitAdvanceWidths,
  numeralsInfo,
  numeralsMetric,
} from './metrics/numerals.js';
export {
  CONFUSABLE_GROUPS,
  glyphDifference,
  scoreDisambiguation,
} from './metrics/disambiguation.js';
export { strokeContrastMetric } from './metrics/strokeContrast.js';
