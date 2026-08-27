/**
 * Generate the app icons.   Run:  node scripts/make-icons.mjs
 *
 * They shipped as the stock Expo placeholder with its construction layer still
 * visible — dashed centre guides, alignment circles, a crosshair — which is
 * what installs to a home screen and goes to the app stores. The two 512px
 * files were also byte-identical, so the "maskable" one was not maskable: the
 * mark ran to the edges and Android's circular mask clipped it.
 *
 * The mark is the game's own language rather than a literal "2048", which is
 * illegible at 192px: four rounded tiles running the palette's cool-to-warm
 * ramp on the brand blue.
 *
 * The artwork is nothing but a background and four rounded rectangles, so it
 * can be drawn directly into an RGBA buffer and PNG-encoded with the zlib that
 * ships with node. That avoids adding a rendering library for four files.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const BG = [0x27, 0x59, 0x73];
const TILES = [[0xc7,0xe5,0xf6],[0x4f,0xc0,0xea],[0xff,0xa6,0x30],[0xdc,0x4e,0x05]];

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) { c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Coverage of a rounded rect at (px,py), supersampled 4x4 for clean edges. */
function coverage(px, py, x, y, w, h, r) {
  let hits = 0;
  for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
    const fx = px + (sx + 0.5) / 4, fy = py + (sy + 0.5) / 4;
    if (fx < x || fx > x + w || fy < y || fy > y + h) continue;
    const cx = Math.min(Math.max(fx, x + r), x + w - r);
    const cy = Math.min(Math.max(fy, y + r), y + h - r);
    if ((fx - cx) ** 2 + (fy - cy) ** 2 <= r * r) hits++;
  }
  return hits / 16;
}

function render(size, safe, path) {
  const inset = (size * (1 - safe)) / 2;
  const area = size * safe;
  const gap = area * 0.06;
  const cell = (area - gap) / 2;
  const radius = cell * 0.18;

  const rects = TILES.map((fill, i) => ({
    x: inset + (i % 2) * (cell + gap),
    y: inset + Math.floor(i / 2) * (cell + gap),
    w: cell, h: cell, r: radius, fill,
  }));

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      let [r, g, b] = BG;
      for (const rect of rects) {
        const a = coverage(x, y, rect.x, rect.y, rect.w, rect.h, rect.r);
        if (a > 0) { r = Math.round(r*(1-a)+rect.fill[0]*a);
                     g = Math.round(g*(1-a)+rect.fill[1]*a);
                     b = Math.round(b*(1-a)+rect.fill[2]*a); }
      }
      const o = rowStart + 1 + x * 4;
      raw[o] = r; raw[o+1] = g; raw[o+2] = b; raw[o+3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
  console.log(path.split('/').pop(), (png.length/1024).toFixed(1) + ' KB');
}

const OUT = join(ROOT, 'apps', 'game', 'public', 'icons');
mkdirSync(OUT, { recursive: true });
render(192, 0.72, `${OUT}/icon-192.png`);
render(512, 0.72, `${OUT}/icon-512.png`);
render(512, 0.56, `${OUT}/icon-maskable-512.png`);
render(1024, 0.72, join(ROOT, 'apps', 'game', 'assets', 'icon.png'));
