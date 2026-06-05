// Color contrast. This is the STANDARDS-BASED half of the score.
// WCAG 2.x is exact math. APCA is provided as a secondary, non-official signal.

import type { RGB, MetricResult, ScoreContext } from './types.js';
import * as apca from 'apca-w3';
import { METRIC_WEIGHTS } from './metrics/common.js';

export function parseHex(hex: string): RGB {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  if (h.length === 8) h = h.slice(0, 6); // ignore alpha
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(c: RGB): number {
  return 0.2126 * srgbToLinear(c.r) + 0.7152 * srgbToLinear(c.g) + 0.0722 * srgbToLinear(c.b);
}

/** WCAG 2.x contrast ratio, 1..21. */
export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export interface WcagResult {
  ratio: number;
  largeText: boolean;
  aa: boolean;
  aaa: boolean;
}

/** WCAG large text = >= 24px, or >= 18.66px when bold. */
export function isLargeText(fontSizePx: number, bold: boolean): boolean {
  return fontSizePx >= 24 || (bold && fontSizePx >= 18.66);
}

export function wcag(fgHex: string, bgHex: string, ctx: ScoreContext = {}): WcagResult {
  const ratio = contrastRatio(parseHex(fgHex), parseHex(bgHex));
  const large = isLargeText(ctx.fontSizePx ?? 16, !!ctx.bold);
  const aaThreshold = large ? 3 : 4.5;
  const aaaThreshold = large ? 4.5 : 7;
  return { ratio, largeText: large, aa: ratio >= aaThreshold, aaa: ratio >= aaaThreshold };
}

/**
 * APCA lightness contrast (Lc) magnitude, or null if the optional dependency
 * is unavailable. Non-official: APCA was pulled from the WCAG 3 draft in 2023.
 */
export function apcaLc(fgHex: string, bgHex: string): number | null {
  try {
    const fg = parseHex(fgHex);
    const bg = parseHex(bgHex);
    const lc = apca.APCAcontrast(
      apca.sRGBtoY([fg.r, fg.g, fg.b]),
      apca.sRGBtoY([bg.r, bg.g, bg.b]),
    );
    return Math.abs(Number(lc));
  } catch {
    return null;
  }
}

function ratioToScore(ratio: number): number {
  if (ratio >= 7) return 1;
  if (ratio >= 4.5) return 0.8 + ((ratio - 4.5) / (7 - 4.5)) * 0.2;
  if (ratio >= 3) return 0.5 + ((ratio - 3) / (4.5 - 3)) * 0.3;
  if (ratio >= 1) return ((ratio - 1) / (3 - 1)) * 0.5;
  return 0;
}

/** Returns a contrast MetricResult, or null when no fg/bg colors were provided. */
export function contrastMetric(ctx: ScoreContext): MetricResult | null {
  if (!ctx.foreground || !ctx.background) return null;
  const w = wcag(ctx.foreground, ctx.background, ctx);
  const lc = apcaLc(ctx.foreground, ctx.background);
  const score = ratioToScore(w.ratio);
  const status = w.aaa ? 'good' : w.aa ? 'fair' : 'poor';
  const apcaNote = lc != null ? ` APCA Lc ${lc.toFixed(0)} (non-official).` : '';
  return {
    id: 'contrast',
    label: 'Color contrast',
    value: Number(w.ratio.toFixed(2)),
    score,
    weight: METRIC_WEIGHTS.colorContrast,
    status,
    detail:
      `WCAG 2.x ratio ${w.ratio.toFixed(2)}:1 — ` +
      `${w.aa ? 'passes' : 'fails'} AA, ${w.aaa ? 'passes' : 'fails'} AAA ` +
      `for ${w.largeText ? 'large' : 'normal'} text.${apcaNote}`,
  };
}
