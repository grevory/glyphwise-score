# glyphwise-score

Heuristic accessibility + legibility scoring for fonts. Framework-free, pure
TypeScript. Built to be consumed by the Glyphwise UI (see the project brief) but
usable standalone.

> **Honesty first.** This produces a *heuristic* score, not a certification. The
> color-contrast portion is standards-based (WCAG 2.x is exact math). The
> glyph-legibility portion is an informed estimate with no validated standard
> behind it. No automated score replaces testing with real users and assistive
> technology. The UI must surface these caveats.

---

## This is a Claude Code handoff

The architecture, types, scoring composition, and the well-defined metrics are
implemented. Your job is to finish the harder metrics, calibrate the weights
against real fonts, and wire up the build. Start by reading the **Metric status**
and **Tasks** sections below, then run the tests to confirm the baseline passes.

Work test-first where possible: the pure functions (`glyphDifference`,
`numeralsInfo`, contrast math, `composeScore`) are all unit-testable without a
font file. Add a couple of real font fixtures for the metrics that need them.

## Install

```bash
npm install
npm test          # vitest — baseline tests should pass
npm run build     # tsc -> dist/
```

`opentype.js` is a peer dependency (the host app already uses it). `apca-w3` is a
runtime dependency used for the secondary APCA signal.

## Quick start

```ts
import opentype from 'opentype.js';
import { scoreFont } from 'glyphwise-score';
import { canvasRasterizer } from 'glyphwise-score/browser';

const font = opentype.parse(await (await fetch(fontUrl)).arrayBuffer());

const result = scoreFont(font, {
  foreground: '#222222',
  background: '#ffffff',
  fontSizePx: 14,
  rasterize: canvasRasterizer, // enables the disambiguation metric (browser only)
});

result.overall;  // 0..100
result.grade;    // 'A'..'F'
result.metrics;  // per-metric breakdown for the UI
result.caveats;  // honesty notes — surface at least one
```

Verify rendered tabular behavior against the live `@font-face` separately:

```ts
import { checkTabularFigures } from 'glyphwise-score/browser';
await document.fonts.ready;
checkTabularFigures('Inter'); // { verdict: 'tabular-available' | 'tabular-default' | 'unsupported', ... }
```

## API

- `scoreFont(font, ctx?) => FontAccessibilityScore` — top-level entry.
- `composeScore(metrics) => FontAccessibilityScore` — combine your own metric list.
- Contrast: `wcag`, `contrastRatio`, `relativeLuminance`, `parseHex`, `isLargeText`, `apcaLc`, `contrastMetric`.
- Metrics: `xHeightMetric`, `numeralsMetric`, `scoreDisambiguation`, `strokeContrastMetric`, plus their lower-level helpers.
- Pure helpers worth reusing: `glyphDifference`, `numeralsInfo`, `digitAdvanceWidths`, `gsubFeatureTags`.

Every metric returns a `MetricResult` with `{ id, label, value, score, weight, status, detail }`. `status` is `good | fair | poor | na`. `detail` is written to be shown directly in the UI.

## Scoring methodology

Overall score = weighted average of the metrics whose `score != null` (n/a
metrics are excluded, not penalized). Weights are a **starting point and a
judgment call — calibrate them** (see Tasks):

| Metric | Weight | Status | Basis |
|---|---|---|---|
| Character disambiguation | 1.5 | implemented (needs rasterizer) | heuristic — glyph outline difference |
| Color contrast | 1.5 | implemented | **standards-based** (WCAG 2.x) + APCA note |
| x-height ratio | 1.0 | implemented | heuristic — x-height / cap height |
| Numeral scanning | 1.0 | implemented | heuristic — GSUB + digit advance widths |
| Stroke contrast | 1.0 | **exported stub (n/a, not included in `scoreFont`)** | heuristic — TODO |

Grade bands: A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, F < 40.

## Metric status

- **Implemented & solid:** contrast (WCAG exact; APCA via `apca-w3`), x-height
  ratio (OS/2 with bounding-box fallback), numeral scanning (feature detection +
  width spread), score composition, grading.
- **Implemented, needs a rasterizer at call time:** character disambiguation.
  Pure diff math is done and tested; pass `canvasRasterizer` in the browser.
- **Stub (returns `na`):** stroke contrast. It remains exported for direct use,
  but is not included in `scoreFont` until implemented.

## Tasks for Claude Code

1. **Stroke contrast** (`src/metrics/strokeContrast.ts`): implement the thick/thin
   ratio. Walk inner/outer outlines of a reference glyph (`o`, `H`) from
   opentype.js path commands, sample perpendicular stroke widths, report
   thickest:thinnest. Map very high contrast to a lower score. Add tests.
2. **Counter openness / aperture** (new metric): a more open aperture (`c`, `e`,
   `a`, `s`) aids legibility. Add `src/metrics/counters.ts` and include it in
   `scoreFont`.
3. **Multi-glyph confusables** in disambiguation: `rn`/`m`, `cl`/`d`, `vv`/`w`.
   Rasterize the rendered string, not single glyphs, and compare.
4. **Calibrate weights and mappings** against a known set: Atkinson Hyperlegible
   and Lexend should score high; thin high-contrast display faces low. Add font
   fixtures under `tests/fixtures/` and assert relative ordering rather than
   absolute numbers.
5. **Build & publish config**: confirm `dist/` ESM output, the `browser` subpath
   export (`./browser`), and `exports` map in `package.json`.

Keep all metrics pure and framework-free. The UI imports from here; this package
must never import React.

## Integrating with the Glyphwise UI

The UI owns presentation only. It should: show `overall` + `grade` prominently,
render each `MetricResult` as a row/card using `status` for color and `detail`
for the explanation, and always display at least one `caveat`. When the user
changes colors, size, or weight, re-run `scoreFont` and re-render — it's cheap
enough to run live. Treat the contrast metric and glyph metrics as visually
distinct groups so the standards-based vs heuristic distinction stays clear.

## Testing

`npm test` runs Vitest in node. The contrast and composition tests need no font.
For metrics that need glyphs, add small OFL font fixtures and load them with
`opentype.loadSync` in node. Prefer asserting *relative* ordering of known fonts
over brittle absolute thresholds.
