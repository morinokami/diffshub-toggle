// Generates the toolbar/store icons as PNGs without external dependencies.
//
// Motif (per the design doc): a rounded dark square with two diff-colored
// arrows — green pointing right (GitHub -> DiffsHub), red pointing left
// (DiffsHub -> GitHub).
//
// Also emits grayed-out variants (icon-gray-*.png) used as the action's
// default icon; declarativeContent swaps in the colored icon on pages
// that can be toggled. In the gray variant both arrows share one gray
// tone, and the top arrow is drawn as an outline so the two arrows stay
// distinguishable without color contrast.
//
// Usage: node scripts/generate-icons.js

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZES = [16, 32, 48, 128];
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "extension",
  "icons",
);

const BACKGROUND = [36, 41, 47, 255]; // GitHub dark gray
const GREEN = [63, 185, 80, 255]; // diff addition green
const RED = [248, 81, 73, 255]; // diff deletion red

// Desaturated and translucent, so the inactive icon reads as "off" on
// both light and dark toolbars.
function grayscale([r, g, b, a]) {
  const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  return [lum, lum, lum, Math.round(a * 0.5)];
}

const GRAY_BACKGROUND = grayscale(BACKGROUND);
const GRAY_ARROW = grayscale(RED);

// Shape parameters in unit coordinates (0..1).
const CORNER_RADIUS = 0.22;
const SHAFT_HALF = 0.065;
const HEAD_HALF = 0.15;
const ARROW_TAIL = 0.18;
const ARROW_TIP = 0.82;
const HEAD_LENGTH = 0.24;
const TOP_Y = 0.36;
const BOTTOM_Y = 0.64;

function insideRoundedSquare(x, y) {
  const r = CORNER_RADIUS;
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

// Arrow pointing right when tail < tip, left when tail > tip.
function insideArrow(x, y, centerY, tail, tip) {
  const dir = Math.sign(tip - tail);
  const headBase = tip - dir * HEAD_LENGTH;
  const dy = Math.abs(y - centerY);

  const inShaft =
    dy <= SHAFT_HALF && (x - tail) * dir >= 0 && (headBase - x) * dir >= 0;
  const headProgress = (tip - x) * dir; // distance from the apex, along the axis
  const inHead =
    (x - headBase) * dir >= 0 &&
    headProgress >= 0 &&
    dy <= (HEAD_HALF * headProgress) / HEAD_LENGTH;

  return inShaft || inHead;
}

// A point is on the arrow's outline when it is inside the arrow but a
// probe ring of the stroke width around it escapes the shape.
function insideArrowOutline(x, y, centerY, tail, tip, width) {
  if (!insideArrow(x, y, centerY, tail, tip)) {
    return false;
  }
  const probes = 8;
  for (let i = 0; i < probes; i++) {
    const angle = (2 * Math.PI * i) / probes;
    const px = x + width * Math.cos(angle);
    const py = y + width * Math.sin(angle);
    if (!insideArrow(px, py, centerY, tail, tip)) {
      return true;
    }
  }
  return false;
}

function colorAt(x, y) {
  if (!insideRoundedSquare(x, y)) {
    return null;
  }
  if (insideArrow(x, y, TOP_Y, ARROW_TAIL, ARROW_TIP)) {
    return GREEN;
  }
  if (insideArrow(x, y, BOTTOM_Y, ARROW_TIP, ARROW_TAIL)) {
    return RED;
  }
  return BACKGROUND;
}

// Gray variant: top arrow as an outline (interior shows the background),
// bottom arrow solid, both in the same gray.
function grayAt(x, y, outlineWidth) {
  if (!insideRoundedSquare(x, y)) {
    return null;
  }
  if (insideArrowOutline(x, y, TOP_Y, ARROW_TAIL, ARROW_TIP, outlineWidth)) {
    return GRAY_ARROW;
  }
  if (insideArrow(x, y, BOTTOM_Y, ARROW_TIP, ARROW_TAIL)) {
    return GRAY_ARROW;
  }
  return GRAY_BACKGROUND;
}

function renderIcon(size, pick = colorAt) {
  const rgba = new Uint8Array(size * size * 4);
  const samples = 4; // 4x4 supersampling for antialiasing

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const x = (px + (sx + 0.5) / samples) / size;
          const y = (py + (sy + 0.5) / samples) / size;
          const color = pick(x, y);
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            a += color[3];
          }
        }
      }
      const total = samples * samples;
      const offset = (py * size + px) * 4;
      // Premultiplied average, un-premultiplied for straight-alpha PNG.
      const alpha = a / total;
      rgba[offset] = alpha > 0 ? Math.round(r / total / (alpha / 255)) : 0;
      rgba[offset + 1] = alpha > 0 ? Math.round(g / total / (alpha / 255)) : 0;
      rgba[offset + 2] = alpha > 0 ? Math.round(b / total / (alpha / 255)) : 0;
      rgba[offset + 3] = Math.round(alpha);
    }
  }
  return rgba;
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, "ascii");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(chunk.subarray(4, 8 + data.length)),
    8 + data.length,
  );
  return chunk;
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // compression, filter, interlace: 0

  // Each scanline is prefixed with filter type 0 (None).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(
      raw,
      y * (size * 4 + 1) + 1,
    );
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const colored = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(colored, encodePng(size, renderIcon(size)));
  console.log(`wrote ${colored}`);

  // Keep the outline at least ~1.4 physical pixels so it survives the
  // smallest sizes.
  const outlineWidth = Math.max(1.4 / size, 0.04);
  const gray = join(OUT_DIR, `icon-gray-${size}.png`);
  writeFileSync(
    gray,
    encodePng(
      size,
      renderIcon(size, (x, y) => grayAt(x, y, outlineWidth)),
    ),
  );
  console.log(`wrote ${gray}`);
}
