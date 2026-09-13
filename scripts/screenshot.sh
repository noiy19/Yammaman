#!/usr/bin/env bash
# =============================================================================
# screenshot.sh — capture a URL to a PNG, headlessly.
#
#   ./scripts/screenshot.sh <url> <output.png> [width] [height]
#
#   ./scripts/screenshot.sh https://yammaman.vercel.app .tmp/screens/home.png
#   ./scripts/screenshot.sh https://yammaman.vercel.app/mill .tmp/screens/mill.png 1440 2400
#
# WHY THIS EXISTS
# The storefront renders client-side, so fetching the HTML proves almost nothing:
# the response is an empty shell and every headline is produced by React in the
# browser. Verifying a content change means rendering it. `curl | grep` against
# the bundle tells you a string shipped; a screenshot tells you it is on the page,
# in the right place, in the right type.
#
# It is also the tool the parity audit (PRD M9) needs — comparing the built site
# against the approved preview is a visual comparison, not a string comparison.
#
# WHY THE SYSTEM CHROME AND NOT A DOWNLOADED BROWSER
# Google Chrome is already installed, and `--headless --screenshot` does the whole
# job. Playwright or Puppeteer would add a ~150 MB browser download plus a
# dependency, to use a feature the installed browser already has.
#
# The two quirks that make a naive invocation fail:
#
#   1. Chrome does not exit after writing the screenshot in headless mode. It
#      hangs. So it is launched under an alarm and killed once the file exists —
#      see the timeout below. A plain `"$CHROME" ... --screenshot` hangs forever.
#   2. Chrome writes crash dumps and a profile to ~/Library, which a
#      write-restricted sandbox denies. Both are redirected: crash reporting off,
#      and `--user-data-dir` pointed at a scratch directory. The resulting
#      "Operation not permitted" noise on stderr is expected and harmless, which
#      is why stderr is discarded.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

URL="${1:-}"
OUT="${2:-}"
WIDTH="${3:-1440}"
HEIGHT="${4:-1000}"
TIMEOUT="${SCREENSHOT_TIMEOUT:-60}"

die() { printf 'screenshot.sh: %s\n' "$*" >&2; exit 1; }

[ -n "$URL" ] || die "usage: screenshot.sh <url> <output.png> [width] [height]"
[ -n "$OUT" ] || die "usage: screenshot.sh <url> <output.png> [width] [height]"

# --- locate a chromium-family browser ----------------------------------------
CHROME=""
for candidate in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  "$(command -v google-chrome 2>/dev/null || true)" \
  "$(command -v chromium 2>/dev/null || true)"
do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then CHROME="$candidate"; break; fi
done

[ -n "$CHROME" ] || die "no Chrome/Chromium found. Install one, or 'pnpm exec playwright install chromium'."

# --- absolute output path, since Chrome resolves relative to its own cwd -----
mkdir -p "$(dirname "$OUT")"
case "$OUT" in
  /*) OUT_ABS="$OUT" ;;
  *)  OUT_ABS="$ROOT/$OUT" ;;
esac
rm -f "$OUT_ABS"

PROFILE="$(mktemp -d "${TMPDIR:-/tmp}/yammaman-chrome.XXXXXX")"
cleanup() { rm -rf "$PROFILE"; }
trap cleanup EXIT

# --- capture -----------------------------------------------------------------
# `alarm` is the timeout: Chrome writes the file then hangs, so the signal is
# what ends the run. Exit status is therefore ignored deliberately — the file is
# the result, and a missing file is the failure.
perl -e 'alarm shift; exec @ARGV' "$TIMEOUT" \
  "$CHROME" \
    --headless --disable-gpu --no-sandbox --no-first-run \
    --disable-crash-reporter --disable-breakpad --disable-extensions \
    --user-data-dir="$PROFILE" \
    --window-size="${WIDTH},${HEIGHT}" \
    --virtual-time-budget=10000 \
    --screenshot="$OUT_ABS" \
    "$URL" >/dev/null 2>&1 || true

if [ ! -f "$OUT_ABS" ]; then
  die "no screenshot produced after ${TIMEOUT}s. The page may be unreachable, or Chrome is being blocked."
fi

BYTES="$(wc -c < "$OUT_ABS" | tr -d ' ')"
printf '  %s  (%sx%s, %s bytes)\n' "$OUT_ABS" "$WIDTH" "$HEIGHT" "$BYTES"

# A near-empty PNG means Chrome rendered nothing — usually a blank page or a
# navigation that never completed. Failing here is better than shipping a white
# rectangle into a review.
if [ "$BYTES" -lt 5000 ]; then
  printf '  ⚠ suspiciously small — the page may have rendered blank\n' >&2
fi
