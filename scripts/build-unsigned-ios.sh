#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"

workspace="$(find ios -maxdepth 1 -name '*.xcworkspace' -type d -print -quit)"
if [[ -z "$workspace" ]]; then
  printf '%s\n' 'No iOS workspace found. Run Expo prebuild and pod install first.' >&2
  exit 1
fi

variant_suffix=''
if [[ "${MERRE_NO_OTA:-0}" == '1' ]]; then
  variant_suffix='-noOTA'
fi
output="$project_root/artifacts"
archive="$output/Merre${variant_suffix}.xcarchive"
mkdir -p "$output"
package="$(mktemp -d "$output/unsigned-ipa.XXXXXX")"

xcodebuild \
  -workspace "$workspace" \
  -scheme Merre \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -archivePath "$archive" \
  archive \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  DEVELOPMENT_TEAM=''

app="$(find "$archive/Products/Applications" -maxdepth 1 -name '*.app' -type d -print -quit)"
if [[ -z "$app" ]]; then
  printf '%s\n' 'The archive contains no iPhone application.' >&2
  exit 1
fi

mkdir -p "$package/Payload"
ditto "$app" "$package/Payload/$(basename "$app")"
cd "$package"
zip -qry "$output/Merre${variant_suffix}-unsigned.ipa" Payload
printf 'Unsigned IPA: %s\n' "$output/Merre${variant_suffix}-unsigned.ipa"
