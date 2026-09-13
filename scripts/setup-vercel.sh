#!/usr/bin/env bash
# =============================================================================
# setup-vercel.sh — link this directory to a Vercel project and print the
# repository secrets the deploy workflow needs.
#
#   cd "/Users/noiyamasaki/Desktop/yammaman:website"
#   source scripts/env.sh
#   ./scripts/setup-vercel.sh
#
# RUN THIS FROM A SHELL THAT SOURCED env.sh. That is not a formality:
#
#   - the Vercel CLI lives in .toolchain/npm-global/bin, which is only on PATH
#     after env.sh runs. In a fresh terminal `vercel` is simply not found.
#   - the CLI's wrapper redirects HOME so it writes its state into
#     .toolchain/vercel-home instead of ~/Library, which the sandbox denies.
#
# The script re-sources env.sh itself, so running it with `./scripts/setup-vercel.sh`
# directly also works — but the login it performs then lives in the workspace,
# which is intentional and is what lets someone else finish the setup.
# =============================================================================

set -euo pipefail

# $0, not BASH_SOURCE: these scripts are EXECUTED, not sourced, so $0 is the
# script path in bash AND zsh. BASH_SOURCE is unset in zsh, where the root
# silently resolved to the parent directory and every toolchain path missed.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=/dev/null
source "$ROOT/scripts/env.sh" >/dev/null

say() { printf '\n== %s\n' "$*"; }
die() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Logged in?
# ---------------------------------------------------------------------------
say "Checking Vercel authentication"

if ! vercel whoami >/dev/null 2>&1; then
  cat <<'EOF'
  Not logged in.

  Run this, complete the browser flow, then run this script again:

      vercel login

  On the scope prompt, choose your PERSONAL account. A team workspace requires
  the Pro plan; picking a team starts a paid scope. (If you have deliberately
  moved to a team to give a collaborator access, pick the team instead — see
  SETUP.md, upgrade trigger #1.)
EOF
  exit 1
fi

WHO="$(vercel whoami 2>/dev/null | tail -1)"
echo "  logged in as: $WHO"

# ---------------------------------------------------------------------------
# 2. Link the directory to a project.
# ---------------------------------------------------------------------------
say "Linking to a Vercel project"

if [ -f .vercel/project.json ]; then
  echo "  already linked — .vercel/project.json exists"
else
  echo "  Not linked yet. 'vercel link' will ask which scope and project."
  echo "  If the project does not exist, let it create one."
  echo
  vercel link
fi

[ -f .vercel/project.json ] || die "Linking did not produce .vercel/project.json"

# ---------------------------------------------------------------------------
# 3. Read the ids.
#
# orgId and projectId are NOT secrets — they identify a project, and they are
# useless without a token. They still belong in repository secrets rather than in
# the repo, because they are account-specific: a committed projectId would make
# every checkout deploy to the same project regardless of who is working.
# ---------------------------------------------------------------------------
say "Project identifiers"

read -r ORG_ID PROJECT_ID < <(
  node -e "
    const j = require('./.vercel/project.json');
    console.log((j.orgId || '') + ' ' + (j.projectId || ''));
  "
)

[ -n "$ORG_ID" ] || die "No orgId in .vercel/project.json"
[ -n "$PROJECT_ID" ] || die "No projectId in .vercel/project.json"

cat <<EOF
  VERCEL_ORG_ID      = $ORG_ID
  VERCEL_PROJECT_ID  = $PROJECT_ID
EOF

# ---------------------------------------------------------------------------
# 4. The token, which only you can create.
# ---------------------------------------------------------------------------
say "The token (you must create this)"

cat <<'EOF'
  There is no CLI command for this — Vercel only issues account tokens from the
  dashboard:

      https://vercel.com/account/tokens

  Create one (name it something like "yammaman-ci") and copy it.

  ⚠  A Vercel personal-account token is FULL ACCESS. There is no fine-grained
     scoping on Hobby: anyone holding it can read your environment variables,
     change settings and delete projects. Treat it as a password. That is
     precisely why it belongs in GitHub secrets rather than in a person's hands —
     it is what lets a contributor get preview deployments without being given
     control of the account.
EOF

# ---------------------------------------------------------------------------
# 5. Where the three values go.
# ---------------------------------------------------------------------------
say "Add all three as repository secrets"

cat <<EOF
  GitHub → this repository → Settings → Secrets and variables → Actions
  → New repository secret

      VERCEL_TOKEN       <the token you just created>
      VERCEL_ORG_ID      $ORG_ID
      VERCEL_PROJECT_ID  $PROJECT_ID

  Then push a branch. .github/workflows/deploy.yml comments a preview URL on the
  pull request.

  Until VERCEL_TOKEN exists, the deploy workflow SKIPS with a notice rather than
  failing — so nothing goes red in the meantime.
EOF

say "Done"
