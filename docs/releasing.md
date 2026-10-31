# Local releases

Requires Node, installed npm dependencies, authenticated `gh` and EAS CLI access (`npx eas-cli@latest whoami`). Commit changes before invoking a command. No credentials belong in this script or repository.

```sh
node scripts/release.mjs status
node scripts/release.mjs push
node scripts/release.mjs build --platform all
node scripts/release.mjs release --version 1.0.11 --notes-file docs/releases/1.0.11.md
node scripts/release.mjs ota --message "Description of fixes"
node scripts/release.mjs all --version 1.0.11 --notes-file docs/releases/1.0.11.md
```

`all` pushes main, creates a draft release, queues existing GitHub Actions builds, then publishes production OTA to compatible installed apps. The release workflow publishes APK and unsigned IPA assets (standard and noOTA variants) after all builds succeed. It does not submit to app stores. `build` alone creates workflow artifacts, without a release.

Mutating commands run the MÁV client build, lint and typecheck. They stop on failure and never create commits, overwrite tags, or force-push. Build/release dispatch returns without waiting for native compilation; use `status` to follow progress. If OTA fails after dispatch, the release build continues: rerun `ota` after resolving the error, not `all` with the same version.

OTA uses the latest published GitHub release's version/build environment and compares both native fingerprints to its successful Actions build log before publishing. Native changes require a new compatible binary release first. Logs must remain available in GitHub Actions. OTA does not reach noOTA installations. Launch the app online to download, then restart to apply under the current app configuration.
