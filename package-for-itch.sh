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
# kit-storage and kit-profile are inlined into the HTML by build.js (EXTERNAL-FILES.md);
# kit-names ships beside the page too, because the bridged kit-leaderboard imports it.
LIB_FILES=(lib/kit-names/kit-names.js lib/kit-leaderboard/kit-leaderboard.js)

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
# zip when present, else Python's standard library (CS017 S12: some machines lack zip).
if command -v zip >/dev/null; then ( cd "$STAGE_DIR" && zip -q -r "$OUT_ZIP" index.html lib )
else ( cd "$STAGE_DIR" && python3 -m zipfile -c "$OUT_ZIP" index.html lib ); fi

echo "Packaged: $OUT_ZIP"; unzip -l "$OUT_ZIP"
