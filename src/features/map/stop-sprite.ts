// Small cached RGBA PNGs work in MapLibre Native and GL JS without a DOM canvas.
// A continuous colored ring, with a small direction tip built into its outer contour.
const cache = new Map<string, { uri: string; size: number }>();
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function u32(value: number) {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}
function chunk(type: string, data: number[]) {
  const bytes = [...type].map((c) => c.charCodeAt(0)).concat(data);
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return [...u32(data.length), ...bytes, ...u32((crc ^ 0xffffffff) >>> 0)];
}
function base64(bytes: number[]) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const value = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    result +=
      alphabet[(value >>> 18) & 63] +
      alphabet[(value >>> 12) & 63] +
      (i + 1 < bytes.length ? alphabet[(value >>> 6) & 63] : '=') +
      (i + 2 < bytes.length ? alphabet[value & 63] : '=');
  }
  return result;
}
function png(width: number, rgba: number[]) {
  const raw: number[] = [];
  for (let y = 0; y < width; y++) {
    raw.push(0);
    for (let x = 0; x < width * 4; x++) raw.push(rgba[y * width * 4 + x]);
  }
  // One uncompressed DEFLATE block; these sprites are at most 31 KB.
  let a = 1,
    b = 0;
  for (const byte of raw) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  const n = raw.length;
  const compressed = [
    0x78,
    0x01,
    1,
    n & 255,
    n >>> 8,
    ~n & 255,
    (~n >>> 8) & 255,
    ...raw,
    ...u32(((b << 16) | a) >>> 0),
  ];
  return `data:image/png;base64,${base64([137, 80, 78, 71, 13, 10, 26, 10, ...chunk('IHDR', [...u32(width), ...u32(width), 8, 6, 0, 0, 0]), ...chunk('IDAT', compressed), ...chunk('IEND', [])])}`;
}
const rgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
export function stopRingId(colors: string[], dark: boolean, directional: boolean) {
  return `stop-ring:${dark ? 'dark' : 'light'}:${directional ? 'tip-v2' : 'round-v2'}:${colors.join(',')}`;
}
export function stopRingImage(id: string) {
  const found = cache.get(id);
  if (found) return found;
  const [, theme, shape, palette] = id.split(':');
  if (!palette || !id.startsWith('stop-ring:')) return null;
  const colors = palette.split(',').filter((color) => /^#[0-9a-f]{6}$/i.test(color));
  if (!colors.length) return null;
  const directional = shape.startsWith('tip');
  const size = 88;
  const center = size / 2;
  const rim = rgb(theme === 'dark' ? '#cbd5e1' : '#475569');
  const values = colors.map(rgb);
  const pixels: number[] = [];
  // Signed distance to the tip; union it with the ring before drawing the rim.
  const triangle = [[0, -41], [10, -22], [-10, -22]];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center, dy = y + 0.5 - center;
      const radius = Math.hypot(dx, dy);
      let outside = radius - 28;
      if (directional) {
        let distance = Infinity, inside = true;
        for (let i = 0; i < 3; i++) {
          const a = triangle[i], b = triangle[(i + 1) % 3];
          const ex = b[0] - a[0], ey = b[1] - a[1];
          const t = Math.max(0, Math.min(1, ((dx - a[0]) * ex + (dy - a[1]) * ey) / (ex * ex + ey * ey)));
          distance = Math.min(distance, Math.hypot(dx - a[0] - t * ex, dy - a[1] - t * ey));
          if (ex * (dy - a[1]) - ey * (dx - a[0]) < 0) inside = false;
        }
        const tip = inside ? -distance : distance;
        // Round the shoulders where the tip meets the circle.
        const blend = Math.max(0, 1.5 - Math.abs(outside - tip)) / 1.5;
        outside = Math.min(outside, tip) - blend * blend * 1.5 / 4;
      }
      const segment = Math.floor(
        (((Math.atan2(dy, dx) + Math.PI / 2) / (2 * Math.PI) + 1) % 1) * colors.length,
      );
      const color = outside > -1 ? rim : directional && dy < -27 ? values[0] : values[segment];
      const alpha = Math.min(Math.max(0, Math.min(1, 0.5 - outside)), Math.max(0, Math.min(1, radius - 21.5)));
      pixels.push(color[0], color[1], color[2], Math.round(alpha * 255));
    }
  const image = { uri: png(size, pixels), size };
  if (cache.size >= 256) cache.delete(cache.keys().next().value!);
  cache.set(id, image);
  return image;
}
