#!/usr/bin/env bash
# =============================================================================
# bootstrap-toolchain.sh — make this workspace runnable.
#
#   ./scripts/bootstrap-toolchain.sh
#
# WHEN YOU NEED THIS
# Only on a machine with no usable Node. If `node -v` already reports v20 or
# newer, you do not need the download — this script will use what you have and
# only install pnpm.
#
# WHY A SELF-CONTAINED TOOLCHAIN
# This machine had no Node, no Homebrew, and no Xcode command line tools, and the
# working copy sits under a write-restricted sandbox. Installing globally was not
# available, so the toolchain lives in .toolchain/ inside the workspace: nothing
# global, nothing outside the project, and deleting the directory removes every
# trace.
#
# THE COLON PROBLEM — read this if you are on the original machine
# The workspace path contains a colon:
#
#   /Users/<you>/Desktop/yammaman:website
#
# PATH is colon-delimited, so that path cannot be a PATH entry. Two things break:
# the toolchain is not found, and node_modules/.bin is not found, so `pnpm run
# build` says `tsc: command not found` even though tsc is installed.
#
# scripts/env.sh solves it with colon-free wrappers under /tmp. SOURCE THAT FILE
# before running anything. This script only installs.
# =============================================================================

set -euo pipefail

# $0, not BASH_SOURCE: these scripts are EXECUTED, not sourced, so $0 is the
# script path in bash AND zsh. BASH_SOURCE is unset in zsh, where the root
# silently resolved to the parent directory and every toolchain path missed.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TC="$ROOT/.toolchain"

# Pinned so a bootstrap is reproducible. Bump deliberately, not by drift.
NODE_VERSION="${NODE_VERSION:-v24.21.0}"
PNPM_MAJOR="${PNPM_MAJOR:-10}"

say() { printf '\n== %s\n' "$*"; }

# ---------------------------------------------------------------------------
# Keep npm's state inside the workspace.
#
# npm defaults to ~/.npm and ~/.npmrc. Under a write-restricted sandbox those
# writes are DENIED, and a half-written cache there fails installs with
# "Your cache folder contains root-owned files". Redirecting both makes the
# setup self-contained and disposable.
# ---------------------------------------------------------------------------
export npm_config_userconfig="$TC/npmrc"
export npm_config_cache="$TC/npm-cache"
export npm_config_prefix="$TC/npm-global"

mkdir -p "$TC" "$TC/npm-global"

# ---------------------------------------------------------------------------
# 1. Node — reuse an existing one, otherwise download a private copy.
# ---------------------------------------------------------------------------
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [ "$MAJOR" -ge 20 ] 2>/dev/null; then
    say "Using the Node already on PATH: $(node -v)"
    NODE_OK=1
  else
    say "Found Node $(node -v), which is older than v20 — installing a private copy instead."
  fi
fi

if [ "$NODE_OK" -eq 0 ] && [ ! -x "$TC/node/bin/node" ]; then
  ARCH="$(uname -m)"
  case "$ARCH" in
    arm64) NODE_ARCH="darwin-arm64" ;;
    x86_64) NODE_ARCH="darwin-x64" ;;
    *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
  esac

  TARBALL="node-$NODE_VERSION-$NODE_ARCH.tar.gz"
  URL="https://nodejs.org/dist/$NODE_VERSION/$TARBALL"

  say "Downloading $NODE_VERSION ($NODE_ARCH)"
  curl -fsSL "$URL" -o "$TC/$TARBALL"
  tar -xzf "$TC/$TARBALL" -C "$TC"
  rm -rf "$TC/node"
  mv "$TC/node-$NODE_VERSION-$NODE_ARCH" "$TC/node"
  rm -f "$TC/$TARBALL"
fi

if [ "$NODE_OK" -eq 0 ]; then
  # NOTE: deliberately not `export PATH="$TC/node/bin:$PATH"`. If $ROOT contains
  # a colon that concatenation produces a broken PATH, and the failure surfaces
  # later as `node: command not found` in the very script meant to fix it.
  # Calling the binary by absolute path sidesteps PATH entirely.
  NODE_BIN="$TC/node/bin/node"
else
  NODE_BIN="$(command -v node)"
fi

say "Node: $("$NODE_BIN" -v)"

# ---------------------------------------------------------------------------
# 2. pnpm
# ---------------------------------------------------------------------------
if [ -x "$TC/npm-global/bin/pnpm" ]; then
  say "pnpm already present: $("$TC/npm-global/bin/pnpm" -v 2>/dev/null || echo '?')"
else
  say "Installing pnpm@$PNPM_MAJOR into .toolchain/npm-global"

  # npm is a launcher script that shells out to `node`. So npm needs node
  # reachable BY NAME, which is precisely what the colon in this path breaks.
  # Two cases:
  #   - a system Node exists → its directory is colon-free, so putting it on
  #     PATH is safe and plain `npm` works;
  #   - only our private Node exists → skip the wrapper entirely and run
  #     npm-cli.js with the interpreter directly.
  if [ "$NODE_OK" -eq 1 ]; then
    export PATH="$(dirname "$NODE_BIN"):$PATH"
    npm install -g "pnpm@$PNPM_MAJOR"
  else
    "$NODE_BIN" "$TC/node/lib/node_modules/npm/bin/npm-cli.js" \
      install -g "pnpm@$PNPM_MAJOR"
  fi
fi

# ---------------------------------------------------------------------------
# 3. Project dependencies
# ---------------------------------------------------------------------------
# SOURCE env.sh FIRST, and this is the crux of the whole script.
#
# pnpm's launcher, like npm's, is a shell script that calls `node` by name. It
# also puts node_modules/.bin on PATH for every script it runs. Both of those
# need a PATH that works — and with a colon in $ROOT they do not. env.sh builds
# colon-free wrappers under /tmp that make both reachable, so the only reliable
# way to run pnpm in this workspace is through it.
say "Installing project dependencies"
# shellcheck source=/dev/null
source "$ROOT/scripts/env.sh"

export PNPM_STORE_DIR="$TC/pnpm-store"
# CI=true stops pnpm blocking on an interactive "remove node_modules?" prompt
# when it has no TTY (which it never does here).
CI=true pnpm install --store-dir "$PNPM_STORE_DIR" || {
  echo
  echo "pnpm install failed. See SETUP.md — the most common cause on this" >&2
  echo "machine is the colon in the workspace path." >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
cat <<'EOF'

--------------------------------------------------------------------------
Toolchain ready.

  source scripts/env.sh      # <-- required, every new shell
  pnpm run dev               # http://localhost:5173
  pnpm run storybook         # http://localhost:6006

env.sh is what makes the binaries reachable despite the colon in this path
(see the long comment in scripts/env.sh). /tmp is cleared on reboot, so
re-source it after a restart — it is idempotent.
--------------------------------------------------------------------------
EOF
