// Numeral scanning: how well digits line up in columns (data grids) and how
// disambiguable they are. Combines GSUB feature detection with a direct
// advance-width check. HEURISTIC.
//
// NOTE: GSUB tells us a feature EXISTS; it does not guarantee the browser
// applies it. For rendered behavior, also run `checkTabularFigures` from
// `glyphcheck-score/browser` against the live @font-face.

import type { OpenTypeFont, MetricResult } from '../types.js';
import { METRIC_WEIGHTS, scoreToStatus } from './common.js';

export function gsubFeatureTags(font: OpenTypeFont): Set<string> {
  const tags = new Set<string>();
  const features = font.tables?.gsub?.features;
  if (Array.isArray(features)) {
    for (const f of features) if (f?.tag) tags.add(f.tag);
  }
  return tags;
}

export function digitAdvanceWidths(font: OpenTypeFont): number[] {
  const widths: number[] = [];
  for (let d = 0; d <= 9; d++) {
    try {
      const g = font.charToGlyph(String(d));
      if (g && typeof g.advanceWidth === 'number') widths.push(g.advanceWidth);
    } catch {
      /* ignore */
    }
  }
  return widths;
}

export interface NumeralsInfo {
  hasTnum: boolean;
  hasLnum: boolean;
  hasOnum: boolean;
  hasZero: boolean;
  tabularByDefault: boolean;
  /** (max - min) / max of default digit advance widths; 0 means perfectly tabular. */
  defaultWidthSpread: number;
}

export function numeralsInfo(font: OpenTypeFont): NumeralsInfo {
  const tags = gsubFeatureTags(font);
  const widths = digitAdvanceWidths(font);
  let spread = 1;
  let tabularByDefault = false;
  if (widths.length >= 2) {
    const max = Math.max(...widths);
    const min = Math.min(...widths);
    spread = max > 0 ? (max - min) / max : 0;
    tabularByDefault = spread < 0.01;
  }
  return {
    hasTnum: tags.has('tnum'),
    hasLnum: tags.has('lnum'),
    hasOnum: tags.has('onum'),
    hasZero: tags.has('zero'),
    tabularByDefault,
    defaultWidthSpread: spread,
  };
}

export function numeralsMetric(font: OpenTypeFont): MetricResult {
  const info = numeralsInfo(font);
  let score = 0.45; // proportional default: fine for prose, poor for grids
  if (info.tabularByDefault || info.hasTnum) score = 0.85;
  if (info.hasZero) score = Math.min(1, score + 0.1);

  const status = scoreToStatus(score);
  const tabular = info.tabularByDefault
    ? 'tabular by default'
    : info.hasTnum
      ? 'tabular available via "tnum"'
      : 'proportional (digits will not align in columns)';

  return {
    id: 'numerals',
    label: 'Numeral scanning',
    value: Number(info.defaultWidthSpread.toFixed(3)),
    score,
    weight: METRIC_WEIGHTS.numerals,
    status,
    detail:
      `Figures are ${tabular}. ` +
      `Slashed/dotted zero: ${info.hasZero ? 'available' : 'not detected'}. ` +
      `Oldstyle figures: ${info.hasOnum ? 'available' : 'not detected'} (verify lining-vs-oldstyle default visually).`,
  };
}
