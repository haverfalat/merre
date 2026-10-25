import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
// A small signed-distance rounded rectangle. Both map engines tint this mask;
// text-fit supplies the original label padding without a fixed badge diameter.
const width = 64, height = 44, radius = 10;
const pixels = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const dx = Math.abs(x + 0.5 - width / 2) - (width / 2 - radius);
  const dy = Math.abs(y + 0.5 - height / 2) - (height / 2 - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - radius;
  const offset = (y * width + x) * 4;
  pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
  pixels[offset + 3] = Math.max(0, Math.min(255, Math.round(255 * (0.75 - outside / 8))));
}
const directory = new URL('../assets/map-markers/', import.meta.url);
await mkdir(directory, { recursive: true });
await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toFile(fileURLToPath(new URL('badge.png', directory)));

// Extra transparent distance-field space prevents the halo reaching the image quad.
const edge = 96;
const arrow = Buffer.alloc(edge * edge * 4);
const triangle = [[48, 16], [80, 78], [16, 78]];
for (let y = 0; y < edge; y++) for (let x = 0; x < edge; x++) {
  const point = [x + 0.5, y + 0.5]; let distance = Infinity; let inside = true;
  for (let i = 0; i < 3; i++) {
    const a = triangle[i], b = triangle[(i + 1) % 3]; const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    distance = Math.min(distance, Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy));
    if (dx * (point[1] - a[1]) - dy * (point[0] - a[0]) < 0) inside = false;
  }
  const i = (y * edge + x) * 4;
  arrow[i] = arrow[i + 1] = arrow[i + 2] = 255;
  arrow[i + 3] = Math.max(0, Math.min(255, Math.round(255 * (0.75 + (inside ? distance : -distance) / 8))));
}
await sharp(arrow, { raw: { width: edge, height: edge, channels: 4 } }).png().toFile(fileURLToPath(new URL('bearing-arrow.png', directory)));

// Screen-sized location fan, with no stroke or distance-field halo.
const locationFan = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><path d="M40 40 L24.977 11.746 A32 32 0 0 1 55.023 11.746 Z" fill="#3b82f6"/></svg>';
await sharp(Buffer.from(locationFan)).resize(160, 160).png().toFile(fileURLToPath(new URL('location-heading.png', directory)));

// Reuse the exact stop icon vectors from the original app in both map engines.
const modes = ['bus', 'rail', 'subway', 'tram', 'ferry', 'cable', 'plane', 'walk', 'stop'];
const { readFile, writeFile } = await import('node:fs/promises');
const entries = [];
for (const mode of modes) for (const theme of ['dark', 'light']) {
  const color = theme === 'dark' ? '#ffffff' : '#0f172a';
  const original = await readFile(new URL(`../assets/map-icons/stop-${mode}.svg`, import.meta.url), 'utf8');
  const filename = `stop-${mode}-${theme}.png`;
  await sharp(Buffer.from(original.replaceAll('#ffffff', color))).resize(64, 64).png().toFile(fileURLToPath(new URL(filename, directory)));
  entries.push(`  'stop-icon-${mode}-${theme}': require('../../../assets/map-markers/${filename}'),`);
}
await writeFile(new URL('../src/features/map/stop-icon-assets.ts', import.meta.url), `// Generated from the assets/map-icons/stop-*.svg vectors.\nexport const stopIconAssets: Record<string, number> = {\n${entries.join('\n')}\n};\n`);
