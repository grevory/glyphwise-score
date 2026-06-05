// Browser-only: rasterize a glyph to a normalized coverage bitmap using canvas.
// Pass this as `ctx.rasterize` to enable the disambiguation metric.

import type { GlyphRasterizer, Bitmap, OpenTypeFont } from '../types.js';

type RasterCanvas = HTMLCanvasElement | OffscreenCanvas;
type RasterContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function makeCanvas(size: number): { canvas: RasterCanvas; ctx: RasterContext } | null {
  let canvas: RasterCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(size, size);
  } else if (typeof document !== 'undefined') {
    canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
  } else {
    return null;
  }
  const ctx = canvas.getContext('2d') as RasterContext | null;
  return ctx ? { canvas, ctx } : null;
}

export const canvasRasterizer: GlyphRasterizer = (
  font: OpenTypeFont,
  char: string,
  size = 64,
): Bitmap | null => {
  const glyph = font.charToGlyph(char);
  if (!glyph || glyph.unicode == null) return null;

  let bb;
  try {
    bb = glyph.getBoundingBox();
  } catch {
    return null;
  }
  const gw = bb.x2 - bb.x1;
  const gh = bb.y2 - bb.y1;
  if (gw <= 0 || gh <= 0) return null;

  const pad = size * 0.1;
  const avail = size - 2 * pad;
  const scaleFactor = avail / Math.max(gw, gh);
  const fontSize = scaleFactor * font.unitsPerEm;

  // opentype getPath(x, y, fontSize): glyph coords scale by fontSize/unitsPerEm,
  // y is the baseline and grows downward on canvas.
  const x = pad - bb.x1 * scaleFactor + (avail - gw * scaleFactor) / 2;
  const y = pad + bb.y2 * scaleFactor + (avail - gh * scaleFactor) / 2;

  const made = makeCanvas(size);
  if (!made) return null;
  const { ctx } = made;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  const path = glyph.getPath(x, y, fontSize);
  path.fill = '#000';
  path.draw(ctx);

  const img = ctx.getImageData(0, 0, size, size);
  const data = new Float32Array(size * size);
  for (let i = 0; i < data.length; i++) {
    data[i] = img.data[i * 4 + 3] / 255; // alpha channel = coverage
  }
  return { size, data };
};
