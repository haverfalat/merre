import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('../assets/branding/', import.meta.url);
const icon = fileURLToPath(new URL('../branding/icon.svg', import.meta.url));
const mark = fileURLToPath(new URL('../branding/mark.svg', import.meta.url));
const whiteMark = fileURLToPath(new URL('../branding/mark-white.svg', import.meta.url));
await mkdir(output, { recursive: true });

await sharp(icon).resize(1024, 1024).removeAlpha().png()
  .toFile(fileURLToPath(new URL('icon.png', output)));
await sharp(icon).resize(64, 64).removeAlpha().png()
  .toFile(fileURLToPath(new URL('favicon.png', output)));
await sharp(mark).resize(1024, 1024, { fit: 'contain', background: '#00000000' }).png()
  .toFile(fileURLToPath(new URL('mark.png', output)));

// Keep the complete mark inside the safe area of Android launcher masks.
for (const [source, name] of [[mark, 'adaptive-icon'], [whiteMark, 'monochrome-icon']]) {
  const foreground = await sharp(source).resize(512, 512, {
    fit: 'contain', background: '#00000000',
  }).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#00000000' } })
    .composite([{ input: foreground, gravity: 'centre' }]).png()
    .toFile(fileURLToPath(new URL(`${name}.png`, output)));
}
