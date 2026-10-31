#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const [command = 'help', ...args] = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--version', '--notes-file', '--message', '--platform'].includes(args[i]) || !args[i + 1])
    throw new Error(`Unknown or incomplete option: ${args[i]}`);
  options[args[i].slice(2)] = args[i + 1];
}
function run(binary, argv, { capture = false, env = process.env } = {}) {
  const result = spawnSync(binary, argv, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', env, maxBuffer: 100 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} ${argv.join(' ')} failed\n${capture ? result.stderr : ''}`);
  return result.stdout?.trim() ?? '';
}
const gh = (...argv) => run('gh', argv, { capture: true });
function clean() {
  if (run('git', ['status', '--porcelain'], { capture: true }))
    throw new Error('Commit or stash your changes first. This script never creates commits.');
}
function checks() {
  run('npm', ['run', 'build', '--prefix', 'vendor/mav-mobile-api']);
  run('npm', ['run', 'lint']);
  run('npm', ['run', 'typecheck']);
  run('git', ['diff', '--check']);
}
function pushed() {
  clean();
  run('git', ['fetch', 'origin', 'main']);
  const head = run('git', ['rev-parse', 'HEAD'], { capture: true });
  if (head !== run('git', ['rev-parse', 'origin/main'], { capture: true }))
    throw new Error('HEAD must equal origin/main. Run the push command first.');
  return head;
}
function push() {
  clean();
  if (run('git', ['branch', '--show-current'], { capture: true }) !== 'main') throw new Error('Switch to main first.');
  run('git', ['push', 'origin', 'main']);
}
function build() {
  const sha = pushed();
  const platform = options.platform ?? 'all';
  if (!['all', 'android', 'ios'].includes(platform)) throw new Error('Invalid platform');
  run('gh', ['workflow', 'run', 'mobile-build.yml', '--ref', 'main', '-f', `platform=${platform}`, '-f', `sha=${sha}`]);
}
function release() {
  const sha = pushed();
  const version = options.version?.replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || !options['notes-file'])
    throw new Error('Release requires --version X.Y.Z and --notes-file PATH');
  readFileSync(options['notes-file']);
  run('gh', ['release', 'create', `v${version}`, '--target', sha, '--title', `Merre ${version}`, '--notes-file', options['notes-file'], '--draft']);
  run('gh', ['workflow', 'run', 'release-drafts.yml', '--ref', 'main']);
  console.log('Draft queued. Android APK and unsigned iOS IPA (standard + noOTA) publish after successful builds.');
}
async function ota() {
  const sha = pushed();
  const latest = JSON.parse(gh('release', 'view', '--json', 'tagName')).tagName;
  const repository = JSON.parse(gh('repo', 'view', '--json', 'nameWithOwner')).nameWithOwner;
  const runs = JSON.parse(gh('run', 'list', '--workflow', 'mobile-build.yml', '--limit', '100', '--json', 'databaseId,displayTitle,conclusion'));
  const buildRun = runs.find(run => run.conclusion === 'success' && run.displayTitle.startsWith(`Release ${latest} (`));
  if (!buildRun) throw new Error(`No successful release build found for ${latest}`);
  const info = JSON.parse(gh('api', `repos/${repository}/actions/runs/${buildRun.databaseId}`));
  const log = gh('run', 'view', String(buildRun.databaseId), '--log');
  const expected = {};
  for (const line of log.split('\n')) {
    const index = line.indexOf('{"sources":');
    const platform = line.startsWith('iOS (standard)') ? 'ios' : line.startsWith('Android (standard)') ? 'android' : null;
    if (platform && index >= 0) expected[platform] = JSON.parse(line.slice(index)).hash;
  }
  const env = { ...process.env, CI: '1', MERRE_NO_OTA: '0', MERRE_PINNED_SDK: '1', MERRE_OTA_CHANNEL: 'production',
    MERRE_RELEASE_VERSION: latest.replace(/^v/, ''), MERRE_BUILD_NUMBER: String(1000 + info.run_number) };
  // Compute against the exact release environment before publishing to installed apps.
  const source = `const {createFingerprintAsync}=require('@expo/fingerprint');(async()=>{const result={};for(const p of ['ios','android']) result[p]=(await createFingerprintAsync(process.cwd(),{platforms:[p]})).hash;console.log(JSON.stringify(result));})().catch(e=>{console.error(e);process.exit(1)});`;
  const actual = JSON.parse(run('node', ['-e', source], { capture: true, env }));
  for (const platform of ['ios', 'android']) {
    if (!expected[platform] || expected[platform] !== actual[platform])
      throw new Error(`${platform} native runtime differs from ${latest}; finish a compatible native release before publishing OTA.`);
  }
  console.log(`OTA runtime matches ${latest} on iOS and Android.`);
  run('npx', ['eas-cli@latest', 'update', '--channel', 'production', '--platform', 'all', '--environment', 'production',
    '--message', options.message ?? `Merre fixes (${sha.slice(0, 7)})`, '--non-interactive'], { env });
}
try {
  if (['push', 'build', 'release', 'ota', 'all'].includes(command)) {
    checks();
    if (command === 'push' || command === 'all') push();
    if (command === 'build') build();
    if (command === 'release' || command === 'all') release();
    if (command === 'ota' || command === 'all') await ota();
    console.log(gh('run', 'list', '--workflow', 'mobile-build.yml', '--limit', '3'));
  } else if (command === 'status') {
    console.log(gh('run', 'list', '--workflow', 'mobile-build.yml', '--limit', '5'));
    console.log(gh('release', 'list', '--limit', '5'));
  } else if (command === 'help') {
    console.log(`node scripts/release.mjs <command> [options]
  push      Push committed main after static checks
  build     Start artifact builds (--platform all|ios|android)
  release   Create draft + queue builds (--version X.Y.Z --notes-file PATH)
  ota       Publish production OTA to both platforms, checking runtime compatibility
  all       Push + release builds + OTA (--version X.Y.Z --notes-file PATH)
  status    Show builds and releases
Options: --message TEXT for OTA. Requires gh authentication and Expo/EAS authentication.
All mutations require a clean committed checkout. Release/build commands return after dispatch.
Release creates signed APKs and unsigned IPAs, including noOTA variants; it does not submit to stores.
OTA reaches compatible standard builds only; noOTA builds require installing a new binary.`);
  } else throw new Error(`Unknown command: ${command}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
