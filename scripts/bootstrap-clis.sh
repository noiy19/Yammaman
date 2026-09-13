#!/usr/bin/env bash
# =============================================================================
# bootstrap-clis.sh — install the GitHub and Vercel CLIs into the workspace.
#
#   ./scripts/bootstrap-clis.sh
#   ./scripts/bootstrap-clis.sh --gh-only
#   ./scripts/bootstrap-clis.sh --vercel-only
#
# WHY NOT HOMEBREW
# There is no Homebrew on this machine and no admin-free way to get it, so both
# CLIs are installed into `.toolchain/` alongside Node and pnpm — nothing global,
# nothing outside the project, and `rm -rf .toolchain` removes every trace.
#
# WHY THESE TWO ARE WORTH INSTALLING EVEN THOUGH git IS BROKEN
# Neither depends on git:
#   - `gh` has its own HTTP client, so `gh auth login` and
#     `gh repo edit --visibility private` work with no git binary at all. That
#     means the repository can be made private before the Xcode command line
#     tools finish downloading.
#   - the Vercel CLI uploads local files directly, so `vercel deploy` produces a
#     real deployment with no commit and no Git integration.
# Git is still required to *commit and push*, which is a separate blocker.
#
# AUTHENTICATION IS INTERACTIVE AND CANNOT BE SCRIPTED
# Both CLIs need a browser/device flow that only the account holder can complete.
# This script installs and then prints the exact command to run; it does not
# pretend to log you in.
# =============================================================================

set -euo pipefail

# $0, not BASH_SOURCE: these scripts are EXECUTED, not sourced, so $0 is the
# script path in bash AND zsh. BASH_SOURCE is unset in zsh, where the root
# silently resolved to the parent directory and every toolchain path missed.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TC="$ROOT/.toolchain"
BIN="$TC/bin"

GH_ONLY=0
VERCEL_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --gh-only) GH_ONLY=1 ;;
    --vercel-only) VERCEL_ONLY=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

say() { printf '\n== %s\n' "$*"; }

# Keep npm's state inside the workspace — its defaults live in ~/.npm and
# ~/.npmrc, which the write sandbox denies.
export npm_config_userconfig="$TC/npmrc"
export npm_config_cache="$TC/npm-cache"
export npm_config_prefix="$TC/npm-global"

mkdir -p "$BIN"

# ---------------------------------------------------------------------------
# GitHub CLI — a standalone Go binary from the release archive.
# ---------------------------------------------------------------------------
if [ "$VERCEL_ONLY" -eq 0 ]; then
  say "GitHub CLI"

  if [ -x "$BIN/gh" ]; then
    echo "  already installed: $("$BIN/gh" --version | head -1)"
  else
    # Pinned rather than "latest" so a re-run is reproducible; bump deliberately.
    GH_VERSION="${GH_VERSION:-v2.100.0}"
    GH_NUM="${GH_VERSION#v}"
    ARCH="$(uname -m)"
    case "$ARCH" in
      arm64) GH_ARCH="macOS_arm64" ;;
      x86_64) GH_ARCH="macOS_amd64" ;;
      *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
    esac

    ZIP="gh_${GH_NUM}_${GH_ARCH}.zip"
    URL="https://github.com/cli/cli/releases/download/${GH_VERSION}/${ZIP}"

    echo "  downloading $GH_VERSION ($GH_ARCH)"
    curl -fsSL "$URL" -o "$TC/$ZIP"
    rm -rf "$TC/gh-extract"
    mkdir -p "$TC/gh-extract"
    unzip -q "$TC/$ZIP" -d "$TC/gh-extract"

    # The archive nests the binary under gh_<ver>_<arch>/bin/.
    FOUND="$(find "$TC/gh-extract" -type f -name gh -perm -u+x | head -1)"
    [ -n "$FOUND" ] || { echo "  could not find the gh binary in the archive" >&2; exit 1; }

    cp "$FOUND" "$BIN/gh"
    chmod +x "$BIN/gh"
    rm -rf "$TC/gh-extract" "$TC/$ZIP"

    echo "  installed: $("$BIN/gh" --version | head -1)"
  fi

  # macOS quarantines downloaded binaries. Without clearing the attribute the
  # first run can be blocked by Gatekeeper with a misleading error.
  xattr -d com.apple.quarantine "$BIN/gh" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# Vercel CLI — a Node package, so it goes into the same global prefix as pnpm.
# ---------------------------------------------------------------------------
if [ "$GH_ONLY" -eq 0 ]; then
  say "Vercel CLI"

  if [ -x "$TC/npm-global/bin/vercel" ]; then
    echo "  already installed: $("$TC/npm-global/bin/vercel" --version 2>/dev/null || echo '?')"
  else
    # SOURCE THE SHIM FIRST. This is not optional and it is not cosmetic.
    #
    # npm runs package lifecycle scripts through `sh -c`, and the Vercel CLI
    # pulls in esbuild, whose postinstall is literally `node install.js`. That
    # needs `node` reachable BY NAME — which is exactly what the colon in this
    # workspace path breaks. Sourcing env.sh only afterwards fails with:
    #
    #   npm error command sh -c node install.js
    #   npm error sh: node: command not found
    #
    # env.sh builds colon-free wrappers under /tmp so the name resolves.
    # shellcheck source=/dev/null
    source "$ROOT/scripts/env.sh"

    npm install -g vercel
    echo "  installed: vercel $("$TC/npm-global/bin/vercel" --version 2>/dev/null || echo '?')"
  fi

  # -------------------------------------------------------------------------
  # A wrapper, because the Vercel CLI cannot be pointed at a config dir.
  #
  # It resolves its paths through `env-paths`, which on macOS is hard-coded to
  # ~/Library/Application Support and ~/Library/Caches. Those are outside the
  # write sandbox, so every command fails with:
  #
  #   EPERM: operation not permitted, mkdir
  #     '/Users/<you>/Library/Application Support/com.vercel.cli'
  #
  # There is no config-dir environment variable to set (the CLI ships none), but
  # env-paths derives its paths from `os.homedir()`, which on POSIX honours
  # $HOME. So the wrapper redirects HOME for this one process and nothing else —
  # exporting HOME globally would send git, ssh and npm looking in the workspace
  # too, which is a much bigger change than this problem warrants.
  # -------------------------------------------------------------------------
  CLI_DIR="$TC/cli"
  mkdir -p "$CLI_DIR"
  VERCEL_ENTRY="$TC/npm-global/lib/node_modules/vercel/dist/vc.js"

  cat > "$CLI_DIR/vercel" <<'WRAPPER'
#!/bin/sh
# vercel — workspace-local wrapper. Generated by scripts/bootstrap-clis.sh.
#
# Redirects HOME so the Vercel CLI writes its config and cache into
# .toolchain/vercel-home rather than ~/Library, which the sandbox denies.
# The real CLI is untouched; this only changes where it keeps its state.
set -e
TC="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$TC/vercel-home"
exec env HOME="$TC/vercel-home" node "$TC/npm-global/lib/node_modules/vercel/dist/vc.js" "$@"
WRAPPER

  chmod +x "$CLI_DIR/vercel"
  echo "  wrapper: .toolchain/cli/vercel (config redirected into the workspace)"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
cat <<'EOF'

--------------------------------------------------------------------------
CLIs installed into .toolchain/

Now source the shim so they are on PATH:

  source scripts/env.sh
  gh --version
  vercel --version

AUTHENTICATION — interactive, you must do this:

  gh auth login        # GitHub → choose HTTPS, and "Login with a web browser"
  vercel login         # Vercel → choose your account/scope

⚠  For `gh`, pick the HTTPS protocol when asked. `gh` does not need git to
   authenticate, but a later `git push` over HTTPS will reuse those credentials.

⚠  For `vercel login`, choose your PERSONAL account scope, not the `yammaman`
   team — a team workspace requires the Pro plan (see SETUP.md).
--------------------------------------------------------------------------
EOF
