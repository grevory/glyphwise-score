// Browser-only: verify tabular-figure behavior as actually RENDERED, by
// measuring digit widths in the DOM. Complements the GSUB feature detection in
// metrics/numerals.ts (which only proves a feature exists in the font file).
//
// Use the live font-family name (the one your @font-face / Bunny Fonts link
// registers). The font must already be loaded; await document.fonts.ready.

export type TabularVerdict = 'tabular-default' | 'tabular-available' | 'unsupported';

export interface TabularCheck {
  defaultEqualWidth: boolean;
  tabularEqualWidth: boolean;
  verdict: TabularVerdict;
}

function digitWidths(family: string, tabular: boolean, sizePx: number): number[] {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.visibility = 'hidden';
  container.style.whiteSpace = 'pre';
  container.style.fontFamily = family;
  container.style.fontSize = `${sizePx}px`;
  container.style.fontVariantNumeric = tabular ? 'tabular-nums' : 'normal';

  const spans: HTMLSpanElement[] = [];
  for (let d = 0; d <= 9; d++) {
    const span = document.createElement('span');
    span.textContent = String(d).repeat(8); // repeat to amplify sub-pixel differences
    container.appendChild(span);
    spans.push(span);
  }

  document.body.appendChild(container);
  try {
    return spans.map((span) => span.getBoundingClientRect().width);
  } finally {
    container.remove();
  }
}

function allEqual(widths: number[], tolerancePx = 0.5): boolean {
  if (widths.length < 2) return true;
  const max = Math.max(...widths);
  const min = Math.min(...widths);
  return max - min <= tolerancePx;
}

export function checkTabularFigures(fontFamily: string, sizePx = 100): TabularCheck {
  const defaultEqualWidth = allEqual(digitWidths(fontFamily, false, sizePx));
  const tabularEqualWidth = allEqual(digitWidths(fontFamily, true, sizePx));
  let verdict: TabularVerdict;
  if (defaultEqualWidth) verdict = 'tabular-default';
  else if (tabularEqualWidth) verdict = 'tabular-available';
  else verdict = 'unsupported';
  return { defaultEqualWidth, tabularEqualWidth, verdict };
}
