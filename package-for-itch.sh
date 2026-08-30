#!/usr/bin/env bash
# Packages Vector Vortex for itch.io: renames the built game to index.html
# (itch.io requires that exact name inside an HTML5 zip) and includes only the
# runtime lib files it actually needs. Repo files are untouched — the rename
# happens in a temp staging dir.
set -euo pipefail

GAME_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
OUT_DIR="$GAME_DIR/dist"
OUT_ZIP="$OUT_DIR/vector-vortex-itch.zip"

HTML_FILE="dist/vector-vortex.html"
LIB_FILES=(lib/kit-names/kit-names.js lib/kit-storage/kit-storage.js lib/kit-leaderboard/kit-leaderboard.js lib/kit-profile/kit-profile.js)

cd "$GAME_DIR"

# Always build fresh — shipping a stale dist/ is a class of bug worth one line.
node build.js

for f in "$HTML_FILE" "${LIB_FILES[@]}"; do
  [[ -f "$f" ]] || { echo "Missing expected file: $GAME_DIR/$f" >&2; exit 1; }
done

STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "$STAGE_DIR"' EXIT

cp "$HTML_FILE" "$STAGE_DIR/index.html"
for f in "${LIB_FILES[@]}"; do mkdir -p "$STAGE_DIR/$(dirname "$f")"; cp "$f" "$STAGE_DIR/$f"; done

mkdir -p "$OUT_DIR"; rm -f "$OUT_ZIP"
( cd "$STAGE_DIR" && zip -q -r "$OUT_ZIP" index.html lib )

echo "Packaged: $OUT_ZIP"; unzip -l "$OUT_ZIP"
