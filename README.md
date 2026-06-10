# glyphcheck-score

Heuristic accessibility and legibility scoring for fonts. `glyphcheck-score` is a
framework-free TypeScript package that combines standards-based color contrast
checks with font-shape heuristics such as x-height, numeral behavior, and
character disambiguation.

It is designed for font tools, design systems, and UI audits that need a
structured, explainable score for a parsed `opentype.js` font.

## Important caveat

This package does not certify that a font is accessible. WCAG 2.x color contrast
is standards-based; the glyph metrics are heuristic estimates. Use the score as
a decision aid, and pair it with real user testing and assistive technology
testing for high-stakes work.

## Install

```bash
npm install glyphcheck-score opentype.js
```

`opentype.js` is a peer dependency. The package also uses `apca-w3` for a
secondary, non-official APCA lightness contrast signal.

## Quick Start

```ts
import opentype from 'opentype.js';
import { scoreFont } from 'glyphcheck-score';
import { canvasRasterizer } from 'glyphcheck-score/browser';

const response = await fetch('/fonts/Inter-Regular.woff');
const font = opentype.parse(await response.arrayBuffer());

const result = scoreFont(font, {
  foreground: '#222222',
  background: '#ffffff',
  fontSizePx: 14,
  rasterize: canvasRasterizer,
});

console.log(result.overall); // 0..100
console.log(result.grade); // A, B, C, D, or F
console.log(result.metrics); // MetricResult[]
```

## Browser Helpers

The root package is pure scoring logic. Browser-only helpers are exported from
`glyphcheck-score/browser`.

```ts
import { checkTabularFigures } from 'glyphcheck-score/browser';

await document.fonts.ready;

const tabular = checkTabularFigures('Inter');
console.log(tabular.verdict);
```

`canvasRasterizer` enables the character disambiguation metric by rendering
glyphs to a normalized coverage bitmap. `checkTabularFigures` verifies whether
digits actually render with equal widths in the browser, complementing the font
file's OpenType feature metadata.

## API

### `scoreFont(font, ctx?)`

Scores a parsed `opentype.js` font and returns:

```ts
interface FontAccessibilityScore {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: MetricResult[];
  caveats: string[];
}
```

`ctx` may include:

```ts
interface ScoreContext {
  fontSizePx?: number;
  bold?: boolean;
  foreground?: string;
  background?: string;
  rasterize?: GlyphRasterizer;
}
```

### `composeScore(metrics)`

Combines custom metric results into the same weighted overall score and grade.

### Contrast Helpers

The root package exports:

- `parseHex`
- `relativeLuminance`
- `contrastRatio`
- `isLargeText`
- `wcag`
- `apcaLc`
- `contrastMetric`

### Metric Helpers

The root package exports:

- `xHeightRatio`
- `xHeightMetric`
- `gsubFeatureTags`
- `digitAdvanceWidths`
- `numeralsInfo`
- `numeralsMetric`
- `CONFUSABLE_GROUPS`
- `glyphDifference`
- `scoreDisambiguation`
- `strokeContrastMetric`

`strokeContrastMetric` is currently an exported placeholder that returns `na`.
It is not included in `scoreFont` until implemented.

## Scoring Model

The overall score is a weighted average of metrics with a numeric score. Metrics
with `status: 'na'` are excluded instead of being penalized.

| Metric                   | Weight | Basis                                      |
| ------------------------ | -----: | ------------------------------------------ |
| Color contrast           |    1.5 | WCAG 2.x ratio plus APCA note              |
| Character disambiguation |    1.5 | Rasterized glyph difference                |
| x-height ratio           |    1.0 | x-height relative to cap height            |
| Numeral scanning         |    1.0 | OpenType features and digit advance widths |

Grade bands:

| Grade | Overall |
| ----- | ------: |
| A     |  85-100 |
| B     |   70-84 |
| C     |   55-69 |
| D     |   40-54 |
| F     |    0-39 |

## Metric Results

Every metric returns:

```ts
interface MetricResult {
  id: string;
  label: string;
  value: number | null;
  score: number | null;
  weight: number;
  status: 'good' | 'fair' | 'poor' | 'na';
  detail: string;
}
```

`detail` is written as user-facing explanatory copy, so applications can render
it directly in result views.

## Development

```bash
npm install
npm test
npm run build
```

The package builds ESM output to `dist/`. Published files are limited to the
compiled package output.
