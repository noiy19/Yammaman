#!/usr/bin/env bash
# =============================================================================
# publish-to-github.sh — first push of this repository.
#
#   ./scripts/publish-to-github.sh
#   ./scripts/publish-to-github.sh --dry-run
#
# WHY THIS IS A SCRIPT AND NOT THREE COMMANDS IN A README
# This repository contains `yammaman-prd.md` and `tech-stack.md`: the commercial
# thesis, named team members, vendor opinions, cost expectations, and candid
# internal notes about the client. `noiy19/Yammaman` was created PUBLIC.
#
# Pushing that to a public repo is not a mistake you can take back — git history
# is served forever, forks and caches survive a delete, and GitHub's own search
# indexes it. So the visibility check below is a GATE, not a warning: the script
# reads the repository's actual `private` flag from the API and refuses to push
# while it is false.
#
# The override exists because there may one day be a genuinely public repo. It is
# deliberately explicit and it makes you type the repository name.
# =============================================================================

set -euo pipefail

# $0, not BASH_SOURCE: these scripts are EXECUTED, not sourced, so $0 is the
# script path in bash AND zsh. BASH_SOURCE is unset in zsh, where the root
# silently resolved to the parent directory and every toolchain path missed.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE_URL_DEFAULT="https://github.com/noiy19/Yammaman.git"
REMOTE_URL="${REMOTE_URL:-$REMOTE_URL_DEFAULT}"
SLUG="${REMOTE_URL#https://github.com/}"
SLUG="${SLUG%.git}"
BRANCH="${BRANCH:-main}"

DRY_RUN=0
ALLOW_PUBLIC=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --allow-public) ALLOW_PUBLIC=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

say() { printf '\n== %s\n' "$*"; }
die() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. THE GATE: refuse to publish confidential docs to a public repository.
#
# This runs BEFORE the git check on purpose. It is the most consequential thing
# this script does, and making someone install a 2 GB toolchain only to be told
# "actually, make the repo private first" is a bad order to find out in.
# ---------------------------------------------------------------------------
say "Checking repository visibility for $SLUG"

VISIBILITY_JSON="$(curl -fsSL --max-time 20 "https://api.github.com/repos/$SLUG" 2>/dev/null || true)"

if [ -z "$VISIBILITY_JSON" ]; then
  die "Could not read https://api.github.com/repos/$SLUG
  If the repository is PRIVATE, the API needs a token to answer. Set one and retry:
    GITHUB_TOKEN=... ./scripts/publish-to-github.sh
  (or verify manually that it is private, then re-run with --allow-public)"
fi

IS_PRIVATE="$(printf '%s' "$VISIBILITY_JSON" | tr ',' '\n' | grep -m1 '"private"' | grep -o 'true\|false' || echo unknown)"

if [ "$IS_PRIVATE" = "true" ]; then
  echo "  ✓ repository is PRIVATE — safe to publish"
elif [ "$IS_PRIVATE" = "false" ]; then
  if [ "$ALLOW_PUBLIC" -eq 1 ]; then
    echo "  ⚠ repository is PUBLIC — proceeding because --allow-public was passed"
  else
    die "REFUSING TO PUSH: $SLUG is PUBLIC.

  This repository contains yammaman-prd.md and tech-stack.md, which hold the
  commercial thesis, named team members, vendor opinions and cost expectations.
  Publishing them is effectively irreversible.

  Fix it first (30 seconds):
    https://github.com/$SLUG/settings   →   Danger Zone   →   Change visibility
                                        →   Make private   →   confirm

  Then re-run this script. If you truly intend a public repository, pass
  --allow-public."
  fi
else
  die "Could not determine visibility for $SLUG (API said: $IS_PRIVATE).
  Confirm manually that it is private before proceeding."
fi

# ---------------------------------------------------------------------------
# 2. git must actually work.
#
# On this machine /usr/bin/git exists but is a stub that fails with
# "xcode-select: error: Unable to get active developer directory" until Xcode
# command line tools are installed. Checking here turns that into one clear
# message instead of a confusing failure mid-push.
# ---------------------------------------------------------------------------
say "Checking git"
if ! git --version >/dev/null 2>&1; then
  die "git is not usable. Install the Xcode command line tools:
    xcode-select --install
  then re-run this script."
fi
echo "  $(git --version)"

# ---------------------------------------------------------------------------
# 3. Stage the initial commit.
# ---------------------------------------------------------------------------
say "Preparing the repository"

if [ ! -d .git ]; then
  git init -q
  echo "  initialised"
else
  echo "  already a git repository"
fi

git symbolic-ref HEAD "refs/heads/$BRANCH" 2>/dev/null || git checkout -q -b "$BRANCH" 2>/dev/null || true

# Local identity, only if the machine has none. A commit that fails for a missing
# user.email is a silly way to lose five minutes.
git config user.name  >/dev/null 2>&1 || git config user.name  "Muen Collective"
git config user.email >/dev/null 2>&1 || git config user.email "dev@muencollective.com"

say "Files to be committed"

# Deny-list check BEFORE staging: a stray artefact or a credential that escaped
# .gitignore is much cheaper to catch here than to purge from history later.
#
# `node_modules` is matched anywhere in the path, not only as a leading segment,
# because the realistic failure is a stray copy — `.nm-backup`, `node_modules.bak`,
# `vendor/node_modules` — created by a tool or a manual experiment. Any of those
# is tens of thousands of files.
LEAKS="$(git status --porcelain --untracked-files=all 2>/dev/null \
  | awk '{print $2}' \
  | grep -E '(^|/)(node_modules($|/)|\.toolchain($|/)|dist($|/)|storybook-static($|/)|\.nm-backup|node_modules\.)' || true)"

# .env files get their own rule, because two of them ARE meant to be committed:
#   .env.example     — the template; documents every variable, holds no values
#   .env.production  — public build config, consumed by CI and Vercel
# Everything else (.env, .env.local, .env.*.local, .env.development, …) is a
# local file that may hold real credentials and must never be pushed.
ENV_LEAKS="$(git status --porcelain --untracked-files=all 2>/dev/null \
  | awk '{print $2}' \
  | grep -E '(^|/)\.env' \
  | grep -vE '(^|/)\.env\.example$' \
  | grep -vE '(^|/)\.env\.production$' || true)"

if [ -n "$LEAKS" ] || [ -n "$ENV_LEAKS" ]; then
  die "These paths would be committed but should not be:
$LEAKS$ENV_LEAKS
  Add them to .gitignore, or investigate why they are not already ignored."
fi

echo "  no credentials, no node_modules, no build output in the change set"

# ---------------------------------------------------------------------------
# .env.production is a COMMITTED file, so it must contain public values only.
#
# Without this guard the file is a trap: it looks like a private env file, so the
# next person to add a Cloudinary secret or a database URL has every reason to
# think it is safe — and pushes an account credential to a public repository. The
# rule is therefore mechanical rather than aspirational: any uncommented
# assignment in it must be VITE_-prefixed, which is exactly the set of values Vite
# inlines into the public bundle and which are therefore already public.
# ---------------------------------------------------------------------------
if [ -f .env.production ]; then
  NON_PUBLIC="$(grep -vE '^[[:space:]]*(#|$)' .env.production | grep -vE '^[[:space:]]*VITE_' || true)"
  if [ -n "$NON_PUBLIC" ]; then
    die ".env.production contains non-VITE_ (server-side) keys, but it is COMMITTED:

$(printf '%s\n' "$NON_PUBLIC" | sed 's/^/    /')

  Anything not prefixed VITE_ is server-side and must not live in a committed
  file. Move it to the deployment platform's server environment and to
  docs/environment.md, and remove it from .env.production."
  fi
  echo "  .env.production contains only public (VITE_) values"
fi

git add -A

COUNT="$(git diff --cached --name-only | wc -l | tr -d ' ')"
echo "  $COUNT file(s) staged"

# CEILING CHECK — the general safety net.
#
# The deny-list above can only catch the specific mistakes someone thought of.
# This catches the rest: any stray directory that slipped past .gitignore and got
# swept up by `git add -A`. During development of this repo a `node_modules`
# backup of 422 MB was one `git add -A` away from being committed, and no
# name-based rule would have flagged it.
#
# 500 is ~5x the real size of this repository (100 files), so it does not
# constrain honest work while still catching bulk accidents by an order of
# magnitude.
MAX_FILES=500

if [ "$COUNT" -gt "$MAX_FILES" ]; then
  say "Largest staged paths"
  git diff --cached --name-only | awk -F/ '{print $1"/"$2}' | sort | uniq -c | sort -rn | head -10

  die "$COUNT files staged, which is more than the $MAX_FILES ceiling.

  That is almost always a stray directory that escaped .gitignore — a backup of
  node_modules, a build output tree, an extracted archive. Review the counts
  above, add the offender to .gitignore, run \`git rm -r --cached <path>\` if it
  is already tracked, and retry.

  If the repository has genuinely grown past $MAX_FILES files, raise MAX_FILES in
  this script — deliberately, as a reviewed change."
fi

if [ "$COUNT" -eq 0 ]; then
  echo "  nothing to commit"
  exit 0
fi

if [ "$DRY_RUN" -eq 1 ]; then
  say "DRY RUN — would commit and push $COUNT file(s) to $REMOTE_URL ($BRANCH)"
  git diff --cached --stat | tail -5
  exit 0
fi

say "Committing"
git commit -q -F - <<'MSG'
Scaffold the Yammaman storefront

React 19 + Vite 7 + TypeScript on the EVA design system with the Yammaman
brand kit, content-as-data, and two isolated tenant surfaces (YAMMA at /,
HARAPPA at /mill).

Structure
- Token layer: EVA vendored and generated, with a brand kit that only
  re-points the alias tier.
- Content: site-content/*.json validated against JSON Schema, plus the
  cross-document rules a schema cannot express (tenant namespace, path
  ownership, duplicate routes, link integrity, heading order).
- Blocks: 10 block types across schema, registry and Storybook.
- Commerce engine: interface + fixture, pending the API rundown.

Gates (each verified to fail on the thing it catches)
- lane: client sandbox vs Muen lanes
- no-ad-hoc-values: no raw hex, no arbitrary Tailwind values
- contrast: WCAG AA, both themes, resolved through the real token graph
- storybook contract: schema / registry / stories must agree
- content: shape + cross-document rules

Copy is placeholder and the vendor choices in tech-stack.md remain tentative
pending the dev-team audit.
MSG
echo "  committed"

# ---------------------------------------------------------------------------
# 4. Push.
# ---------------------------------------------------------------------------
say "Pushing to $REMOTE_URL"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# --set-upstream so a later bare `git push` works.
git push -u origin "$BRANCH"

cat <<EOF

--------------------------------------------------------------------------
Pushed.

  Next: branch protection on $BRANCH — require the CI check to pass before
  merge, so the gates are load-bearing rather than informational:
    https://github.com/$SLUG/settings/branches

  Then connect Vercel, with staging and production as separate environments
  (tech-stack.md). Production is deployed by Muen Collective only, after
  Nana's sign-off — see SETUP.md.
--------------------------------------------------------------------------
EOF
