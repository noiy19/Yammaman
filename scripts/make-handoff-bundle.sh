#!/usr/bin/env bash
# =============================================================================
# make-handoff-bundle.sh — produce a portable archive of the scaffold.
#
#   ./scripts/make-handoff-bundle.sh
#   ./scripts/make-handoff-bundle.sh --tar      # .tar.gz instead of .zip
#
# WHY A BUNDLE EXISTS AT ALL
# Thuy is pushing the first commit to the repository, so at the moment he starts
# there is nothing on GitHub for him to clone. This produces the scaffold as a
# file he can be sent, which is the only way to hand it over when he goes first.
#
# WHAT IS EXCLUDED, AND WHY IT MATTERS
#   .toolchain/        ~500 MB of machine-local Node/pnpm/CLI + auth tokens
#   node_modules/      hundreds of MB, reproducible with `pnpm install`
#   dist/, storybook-static/   build output
#   .env               LOCAL FILE — may hold credentials. Never shipped.
#   .git/              history belongs to the repo, not to a zip
#
# The script refuses to produce an archive if a credential looks like it would be
# included, on the same reasoning as the publish guard: it is far cheaper to stop
# here than to recall a file from someone's inbox.
# =============================================================================

set -euo pipefail

# $0, not BASH_SOURCE: these scripts are EXECUTED, not sourced, so $0 is the
# script path in bash AND zsh. BASH_SOURCE is unset in zsh, where the root
# silently resolved to the parent directory and every toolchain path missed.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FORMAT="zip"
for arg in "$@"; do
  case "$arg" in
    --tar) FORMAT="tar" ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

OUT_DIR="$ROOT/.tmp"
STAMP="$(date +%Y%m%d)"
NAME="yammaman-scaffold-$STAMP"

say() { printf '\n== %s\n' "$*"; }
die() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

mkdir -p "$OUT_DIR"

# ---------------------------------------------------------------------------
# 1. Pre-flight: no credentials in anything that would be included.
# ---------------------------------------------------------------------------
say "Checking for credentials"

# Local env files are excluded from the archive below, so their presence is
# normal and must NOT stop the run. But they are also exactly the files someone
# attaches to an email by hand while "just sending the project over", so they get
# a loud warning rather than silence.
LEAKS="$(find . \
  -not -path "./node_modules/*" -not -path "./.toolchain/*" \
  -not -path "./dist/*" -not -path "./storybook-static/*" \
  -not -path "./.git/*" -not -path "./.tmp/*" \
  \( -name ".env" -o -name ".env.local" -o -name ".env.*.local" \) -print 2>/dev/null || true)"

if [ -n "$LEAKS" ]; then
  echo "  ⚠ local env file(s) present — EXCLUDED from the archive automatically:"
  printf '%s\n' "$LEAKS" | sed 's/^/      /'
  echo "      These are not part of the scaffold. If you send the project by any"
  echo "      other route (Drive, AirDrop, a hand-made zip), leave them out."
else
  echo "  no local .env files present"
fi

# Scan the tree that WILL be included for obvious credential shapes.
CREDS="$(grep -rInE "(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY|api_secret['\"]?\s*[:=]\s*['\"]?[A-Za-z0-9]{12,})" \
  --exclude-dir=node_modules --exclude-dir=.toolchain --exclude-dir=dist \
  --exclude-dir=storybook-static --exclude-dir=.tmp --exclude-dir=.git \
  --exclude-dir=.vercel . 2>/dev/null || true)"

if [ -n "$CREDS" ]; then
  die "Possible credentials found in the tree that would be bundled:
$CREDS
  Remove them before producing a handoff archive."
fi
echo "  no credential-shaped strings in the bundled tree"

# .env.production is included on purpose (it holds only public values), so prove
# that claim rather than asserting it.
if [ -f .env.production ]; then
  NON_PUBLIC="$(grep -vE '^[[:space:]]*(#|$)' .env.production | grep -vE '^[[:space:]]*VITE_' || true)"
  [ -z "$NON_PUBLIC" ] || die ".env.production contains non-VITE_ keys; refusing to bundle."
  echo "  .env.production holds only public (VITE_) values"
fi

# ---------------------------------------------------------------------------
# 2. Build the archive.
# ---------------------------------------------------------------------------
say "Creating the archive"

rm -f "$OUT_DIR/$NAME.zip" "$OUT_DIR/$NAME.tar.gz"

# ---------------------------------------------------------------------------
# The include list is built EXPLICITLY, as a filter, rather than as a sequence
# of `-x` patterns.
#
# WHY: `-x ".env"` excludes the file named exactly `.env` and NOTHING ELSE. That
# looks like it covers environment files and does not. An earlier version of this
# script shipped `.env.local` — created by `vercel link` and containing a live
# `VERCEL_OIDC_TOKEN` — inside a handoff archive, because the exclusion list and
# the verification regex both only knew about the exact name `.env`.
#
# So the rule is stated positively instead: ANY `.env*` file is dropped EXCEPT
# the two that belong in a handoff — `.env.example` (the template, no values) and
# `.env.production` (committed public build config). A new `.env.staging` or
# `.env.production.local` is therefore excluded by default rather than by
# someone remembering to add it.
# ---------------------------------------------------------------------------
INCLUDE_LIST="$OUT_DIR/$NAME.files"

find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.toolchain/*" \
  -not -path "./dist/*" \
  -not -path "./storybook-static/*" \
  -not -path "./.tmp/*" \
  -not -path "./.vercel/*" \
  -not -path "./.git/*" \
  -not -name ".DS_Store" \
  -not -name "*.zip" \
  -not -name "*.tar.gz" \
  | sed 's|^\./||' \
  | awk '
      # Drop every environment file except the two that are safe to hand over.
      /(^|\/)\.env/ {
        n = $0
        if (n == ".env.example" || n == ".env.production") { print; next }
        next
      }
      { print }
    ' > "$INCLUDE_LIST"

FILE_COUNT_PLANNED="$(wc -l < "$INCLUDE_LIST" | tr -d ' ')"
[ "$FILE_COUNT_PLANNED" -gt 0 ] || die "The include list is empty; refusing to build an archive."

if [ "$FORMAT" = "zip" ]; then
  command -v zip >/dev/null 2>&1 || die "zip not available; re-run with --tar"
  # -@ reads the file names from stdin, so the filter above is authoritative.
  zip -q "$OUT_DIR/$NAME.zip" -@ < "$INCLUDE_LIST"
  ARCHIVE="$OUT_DIR/$NAME.zip"
else
  tar -czf "$OUT_DIR/$NAME.tar.gz" -T "$INCLUDE_LIST"
  ARCHIVE="$OUT_DIR/$NAME.tar.gz"
fi

rm -f "$INCLUDE_LIST"

# ---------------------------------------------------------------------------
# 3. Verify the archive, rather than trusting the exclusion list.
# ---------------------------------------------------------------------------
say "Verifying the archive contents"

if [ "$FORMAT" = "zip" ]; then
  LISTING="$(unzip -Z1 "$ARCHIVE")"
else
  LISTING="$(tar -tzf "$ARCHIVE")"
fi

# Paths that must never appear. Written to catch the WHOLE CLASS, not the
# instance: any `.env*` other than the two allowed files, not just `.env`.
#
# The old regex here was `(^|/)\.env$`, which is why a bundle containing
# `.env.local` passed its own verification while carrying a live token.
BAD="$(printf '%s\n' "$LISTING" \
  | grep -E '(^|/)(node_modules|\.toolchain|dist|storybook-static|\.git|\.vercel)(/|$)' \
  || true)"

BAD_ENV="$(printf '%s\n' "$LISTING" \
  | grep -E '(^|/)\.env' \
  | grep -vE '(^|/)\.env\.example$' \
  | grep -vE '(^|/)\.env\.production$' \
  || true)"

if [ -n "$BAD" ] || [ -n "$BAD_ENV" ]; then
  die "The archive contains paths that must not be shipped:
$BAD$BAD_ENV
  Nothing was sent. Fix the INCLUDE_LIST filter in this script and re-run."
fi

FILE_COUNT="$(printf '%s\n' "$LISTING" | grep -cvE '/$' || true)"
SIZE="$(du -h "$ARCHIVE" | cut -f1)"

# Report the environment files that DID make it, so the claim is checkable
# rather than asserted.
ENV_KEPT="$(printf '%s\n' "$LISTING" | grep -E '(^|/)\.env' | tr '\n' ' ' || true)"

echo "  ✓ no node_modules, build output, .git or .vercel"
echo "  ✓ no environment files except: ${ENV_KEPT:-(none)}"
echo "  ✓ $FILE_COUNT files, $SIZE"

# ---------------------------------------------------------------------------
# 4. Report.
# ---------------------------------------------------------------------------
cat <<EOF

--------------------------------------------------------------------------
Handoff archive ready:

  $ARCHIVE

Send that to Thuy. It contains everything he needs to run the project:

  pnpm install
  pnpm run dev          # http://localhost:5173
  pnpm run storybook    # http://localhost:6006
  pnpm run gate         # every check

He does NOT need the toolchain bootstrap: he has his own Node. He only needs
Node 20+ and pnpm.

⚠  Tell him to make sure his working directory has NO COLON in its path. A colon
   breaks PATH, which makes node_modules/.bin unreachable and every script fail
   with "sh: tsc: command not found" even though nothing is missing. Renaming the
   folder is a five-second fix before any work is done; it is a painful one after.

⚠  The accompanying document is docs/handoff-to-thuy.md — it is inside the
   archive, but send it in the message too so he reads it before starting.
--------------------------------------------------------------------------
EOF
