import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const installed = path.dirname(require.resolve('maplibre-gl/package.json'));
const target = fileURLToPath(new URL('../public/maplibre/', import.meta.url));
await mkdir(target, { recursive: true });
// v6 ships ESM workers separately. Metro cannot rewrite their import.meta URLs.
// Copy from the locked package so worker and main-thread protocols always match.
for (const filename of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) await copyFile(path.join(installed, 'dist', filename), path.join(target, filename));
await copyFile(path.join(installed, 'LICENSE.txt'), path.join(target, 'LICENSE.txt'));
