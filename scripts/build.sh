#!/bin/sh
# Packages extension/ into a Chrome Web Store ZIP (manifest.json at the root).
set -eu
cd "$(dirname "$0")/../extension"
VERSION=$(node -p 'require("./manifest.json").version')
OUT="../diffshub-toggle-$VERSION.zip"
rm -f "$OUT"
zip -r "$OUT" . -x ".*" -x "*/.*"
