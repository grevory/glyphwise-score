// Public types for glyphcheck-score.

/** Quality status for a single metric, for UI badging. */
export type MetricStatus = 'good' | 'fair' | 'poor' | 'na';

export interface MetricResult {
  /** Stable identifier, e.g. "xHeight". */
  id: string;
  /** Human label for the UI. */
  label: string;
  /** Raw measured value (units vary per metric; explained in `detail`). null when not measurable. */
  value: number | null;
  /** Normalized 0..1 quality score, or null when the metric did not run. */
  score: number | null;
  /** Relative contribution to the overall score (only counted when score != null). */
  weight: number;
  status: MetricStatus;
  /** Human-readable explanation, safe to surface directly in the UI. */
  detail: string;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ScoreContext {
  /** Intended rendering size in CSS px; used for WCAG large-text thresholds. Defaults to 16. */
  fontSizePx?: number;
  /** Whether the intended text is bold; affects the WCAG large-text threshold. */
  bold?: boolean;
  /** Foreground (text) color as hex, e.g. "#222". Enables the contrast metric when paired with background. */
  foreground?: string;
  /** Background color as hex. */
  background?: string;
  /**
   * Optional glyph rasterizer. Providing it enables the character-disambiguation
   * metric. Use `canvasRasterizer` from `glyphcheck-score/browser` in the browser.
   */
  rasterize?: GlyphRasterizer;
}

/** Renders a single character to a normalized square coverage bitmap. Returns null if the glyph is missing. */
export type GlyphRasterizer = (font: OpenTypeFont, char: string, size: number) => Bitmap | null;

export interface Bitmap {
  /** width === height === size */
  size: number;
  /** Coverage 0..1 per cell, length size*size, row-major. */
  data: Float32Array | number[];
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface FontAccessibilityScore {
  /** 0..100 weighted heuristic score over applicable metrics. */
  overall: number;
  grade: Grade;
  metrics: MetricResult[];
  /** Always-present honesty notes. The UI should surface at least one. */
  caveats: string[];
}

/**
 * Loose alias for an opentype.js Font. Kept as `any` so consumers are not forced
 * to install @types/opentype.js. We only touch a small, stable surface:
 * `unitsPerEm`, `tables.os2`, `tables.gsub`, `charToGlyph(ch)`, and on a glyph:
 * `advanceWidth`, `unicode`, `getBoundingBox()`, `getPath(x, y, size)`.
 */
export type OpenTypeFont = any;
