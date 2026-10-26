import { execFileSync } from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'vendor/budapestgo-api');
const git = (...args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
if (!existsSync(path.join(directory, 'package.json')))
  git('submodule', 'update', '--init', 'vendor/budapestgo-api');
let hasGit = false;
try {
  hasGit =
    existsSync(path.join(directory, '.git')) &&
    git('-C', directory, 'rev-parse', '--show-toplevel') === directory;
} catch {}
const packaged = process.env.EAS_BUILD === 'true' || !hasGit;
const dirty = !packaged ? git('-C', directory, 'status', '--porcelain') : '';
if (packaged) {
  console.log('BudapestGO: using packaged SDK sources.');
} else if (dirty) {
  console.warn('BudapestGO: keeping local edits; remote synchronization skipped.');
} else {
  let fetched = false;
  try {
    git('-C', directory, 'fetch', 'origin', 'main');
    fetched = true;
  } catch {
    console.warn('BudapestGO: remote unavailable; using the local revision.');
  }
  if (fetched) {
    try {
      git('-C', directory, 'merge-base', '--is-ancestor', 'HEAD', 'origin/main');
      git('-C', directory, 'checkout', '--detach', 'origin/main');
    } catch {
      console.warn('BudapestGO: keeping divergent local revision.');
    }
  }
}
execFileSync(
  process.execPath,
  [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(directory, 'tsconfig.json')],
  { cwd: root, stdio: 'inherit' },
);
const assets = path.join(root, 'assets/budapestgo');
mkdirSync(assets, { recursive: true });
for (const name of ['barlow_regular.ttf', 'barlow_bold.ttf', 'LICENSE.vivus', 'OFL.barlow.txt'])
  copyFileSync(path.join(directory, 'assets', name), path.join(assets, name));
console.log(
  `BudapestGO SDK: ${hasGit ? git('-C', directory, 'rev-parse', '--short', 'HEAD') : 'packaged'}`,
);
