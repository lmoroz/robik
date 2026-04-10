import path from 'node:path';

import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';

const FONT_PATH = path.join(__dirname, 'fonts', 'PressStart2P-Regular.ttf');
GlobalFonts.registerFromPath(FONT_PATH, 'PressStart2P');

const CANVAS_WIDTH = 800;
const PADDING = 32;
const LINE_HEIGHT = 28;
const FONT_SIZE = 16;
const STATUS_HEIGHT = 36;
const SEPARATOR_HEIGHT = 2;
const MAX_HEIGHT = 2048;
const FONT = `${FONT_SIZE}px PressStart2P`;
const STATUS_FONT = `${FONT_SIZE - 2}px PressStart2P`;

export type ImageVariant = 'response' | 'system' | 'error';

interface VariantStyle {
  bg: string;
  text: string;
  status: string;
}

const VARIANT_STYLES: Record<ImageVariant, VariantStyle> = {
  response: { bg: '#4080C0', text: '#FFFFFF', status: '#80D0FF' },
  system: { bg: '#2E7D32', text: '#E8F5E9', status: '#A5D6A7' },
  error: { bg: '#8B1A1A', text: '#FFD6D6', status: '#FF8A80' },
};

function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const measured = ctx.measureText(test).width;

      if (measured > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }

    if (current) lines.push(current);
  }

  return lines;
}

export function renderRetroImage(text: string, model?: string, variant: ImageVariant = 'response'): Buffer {
  const style = VARIANT_STYLES[variant];
  // Measure pass — compute needed height
  const measure = createCanvas(CANVAS_WIDTH, 1);
  const mCtx = measure.getContext('2d');
  mCtx.font = FONT;

  const maxTextWidth = CANVAS_WIDTH - PADDING * 2;
  const lines = wrapText(mCtx, text, maxTextWidth);
  const textBottom = PADDING + lines.length * LINE_HEIGHT;
  const statusTop = textBottom + PADDING + SEPARATOR_HEIGHT;
  const contentHeight = statusTop + STATUS_HEIGHT;
  const height = Math.min(contentHeight, MAX_HEIGHT);

  // Render pass
  const canvas = createCanvas(CANVAS_WIDTH, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, height);

  // Scanline effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, CANVAS_WIDTH, 2);
  }

  // Text
  ctx.fillStyle = style.text;
  ctx.font = FONT;
  ctx.textBaseline = 'top';

  const maxLines = Math.floor((height - PADDING - PADDING - SEPARATOR_HEIGHT - STATUS_HEIGHT) / LINE_HEIGHT);
  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines && visibleLines.length > 0) {
    visibleLines[visibleLines.length - 1] = '...';
  }

  for (let i = 0; i < visibleLines.length; i++) {
    ctx.fillText(visibleLines[i], PADDING, PADDING + i * LINE_HEIGHT);
  }

  // Separator line
  const actualStatusTop = PADDING + visibleLines.length * LINE_HEIGHT + PADDING;
  ctx.fillStyle = style.text;
  ctx.fillRect(PADDING, actualStatusTop, CANVAS_WIDTH - PADDING * 2, SEPARATOR_HEIGHT);

  // Status bar
  ctx.fillStyle = style.status;
  ctx.font = STATUS_FONT;
  ctx.textBaseline = 'middle';
  const statusText = model ? `ROBIK // ${model.toUpperCase()}` : 'ROBIK // READY';
  ctx.fillText(statusText, PADDING, actualStatusTop + SEPARATOR_HEIGHT + STATUS_HEIGHT / 2);

  return Buffer.from(canvas.toBuffer('image/png'));
}
