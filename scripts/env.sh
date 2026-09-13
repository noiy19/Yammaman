#!/usr/bin/env bash
# =============================================================================
# env.sh — the toolchain shim for this workspace.
#
#   source scripts/env.sh
#
# WHY THIS FILE EXISTS
# This workspace lives at a path containing a colon:
#
#   /Users/noiyamasaki/Desktop/yammaman:website
#
# PATH is colon-delimited, so ANY absolute path containing a colon cannot be a
# PATH entry — macOS splits it into two bogus entries. That silently breaks two
# things:
#
#   1. The self-contained Node toolchain in .toolchain/ — `node` is not found.
#   2. node_modules/.bin — pnpm prepends it to PATH for every script, so
#      `pnpm run build` fails with `sh: tsc: command not found` even though tsc
#      is installed. pnpm warns about this on every command.
#
# THE FIX
# Colon-free shims under /tmp, which ARE legal PATH entries.
#
# For the toolchain, a directory symlink is enough: node/npm resolve their own
# relative symlinks correctly once the parent is followed.
#
# For node_modules/.bin it is NOT enough, and this is the subtle part. pnpm
# writes those entries as shell scripts that locate their payload with
# `basedir=$(dirname "$0")`. Reached through a symlinked directory, $0 is the
# shim path, so they look for the payload beside the shim and die with
# `Cannot find module '/tmp/.../typescript/bin/tsc'`. So we generate a one-line
# delegating wrapper per binary that execs the REAL path. Then $0 inside pnpm's
# script is the real one and its relative lookup lands correctly.
#
# Nothing in the project moves. /tmp is cleared on reboot, so re-source this
# after a restart. Sourcing it repeatedly is harmless.
# =============================================================================

# ---------------------------------------------------------------------------
# Resolve this file's directory IN BOTH bash AND zsh.
#
# `BASH_SOURCE` is a bash-ism. zsh leaves it UNSET even when the file is
# sourced, so `dirname ""` yields "." and the root silently resolves to the
# PARENT of the current directory. The failure is quiet and misleading: the
# script still runs and still prints its banner, but every toolchain path points
# somewhere that does not exist, so it reports
#
#   yammaman env ready — node MISSING, pnpm MISSING
#
# and `vercel` is then "command not found". Since these scripts are sourced from
# zsh on macOS — the default interactive shell — that was not an edge case.
#
# The zsh branch uses `eval` on purpose: written literally, `${(%):-%x}` is a
# zsh-only expansion that bash must still parse, and it fails there. eval defers
# parsing to the branch that actually runs.
# ---------------------------------------------------------------------------
if [ -n "${BASH_VERSION:-}" ]; then
  _yammaman_self="${BASH_SOURCE[0]}"
elif [ -n "${ZSH_VERSION:-}" ]; then
  eval '_yammaman_self="${(%):-%x}"'
else
  # Fallback for other shells: only correct when invoked, not sourced.
  _yammaman_self="$0"
fi

YAMMAMAN_ROOT="$(cd "$(dirname "$_yammaman_self")/.." && pwd)"
export YAMMAMAN_ROOT

# Sanity-check the resolution rather than letting a wrong root produce a wall of
# "MISSING" lines that look like a broken toolchain.
if [ ! -f "$YAMMAMAN_ROOT/package.json" ]; then
  echo "env.sh: resolved the project root to '$YAMMAMAN_ROOT', which is not this project." >&2
  echo "  Source it by full path instead:" >&2
  echo "    source \"$(cd "$(dirname "$_yammaman_self")" && pwd)/env.sh\"" >&2
  unset _yammaman_self
  return 1 2>/dev/null || exit 1
fi
unset _yammaman_self

YAMMAMAN_SHIM="${YAMMAMAN_SHIM:-/tmp/yammaman-shim}"
export YAMMAMAN_SHIM

# DEFENSIVE: an earlier version of this script symlinked $YAMMAMAN_SHIM/bin at
# the real node_modules/.bin. That is a trap — `rm -f "$shim"/*` follows the
# symlink and deletes the CONTENTS OF THE TARGET, i.e. it wipes pnpm's real bin
# shims. So: if $YAMMAMAN_SHIM/bin is ever a symlink, remove the LINK itself
# (`rm -f` on a symlink does not follow it) and rebuild it as a real directory
# before anything writes into it.
if [ -L "$YAMMAMAN_SHIM/bin" ]; then
  echo "env.sh: replacing stale bin symlink (would delete through it)" >&2
  rm -f "$YAMMAMAN_SHIM/bin"
fi
mkdir -p "$YAMMAMAN_SHIM/bin"

# --- toolchain (node / npm / pnpm / gh) --------------------------------------
# The whole .toolchain directory is symlinked once, so each binary directory
# becomes reachable without its colon-bearing real path ever appearing in PATH.
# They are added individually because a machine with its own Node still needs
# the locally-installed pnpm and gh.
if [ -d "$YAMMAMAN_ROOT/.toolchain" ]; then
  ln -sfn "$YAMMAMAN_ROOT/.toolchain" "$YAMMAMAN_SHIM/toolchain"

  # BUG WATCH: build this list in ONE prepend, not four.
  #
  # `export PATH="X:$PATH"` PREPENDS, so a sequence of them leaves the LAST
  # assignment at the FRONT. Writing these as four separate exports silently
  # reversed the priority order, and `vercel` resolved to the raw npm symlink
  # instead of the wrapper — which then failed with the very EPERM the wrapper
  # exists to prevent. Order below is highest priority first.
  #
  # `cli` MUST come before `npm-global/bin` so the vercel wrapper shadows the raw
  # symlink. It also has to be reached THROUGH the `toolchain` symlink rather
  # than linked directly: the wrapper derives its root from `dirname $0/..`, and
  # `cd` only resolves symlinks physically when the parent is itself a symlink.
  _yc_dirs=""
  for _yc_d in cli node/bin npm-global/bin bin; do
    if [ -d "$YAMMAMAN_ROOT/.toolchain/$_yc_d" ]; then
      _yc_dirs="$_yc_dirs:$YAMMAMAN_SHIM/toolchain/$_yc_d"
    fi
  done
  if [ -n "$_yc_dirs" ]; then
    export PATH="${_yc_dirs#:}:$PATH"
  fi
  unset _yc_dirs _yc_d
fi

# --- npm/pnpm state, redirected into the workspace ---------------------------
# npm's defaults live in ~/.npm and ~/.npmrc. Under a write-restricted sandbox
# those are denied, and a half-written cache there fails installs in confusing
# ways. Keeping them in .toolchain makes the setup self-contained and disposable.
export npm_config_userconfig="$YAMMAMAN_ROOT/.toolchain/npmrc"
export npm_config_cache="$YAMMAMAN_ROOT/.toolchain/npm-cache"
export PNPM_HOME="$YAMMAMAN_ROOT/.toolchain/pnpm-home"
export PNPM_STORE_DIR="$YAMMAMAN_ROOT/.toolchain/pnpm-store"
export npm_config_store_dir="$PNPM_STORE_DIR"

# The prefix MUST be set here, not only inside bootstrap-clis.sh.
#
# Without it, `npm install -g <pkg>` from a shell that sourced this file installs
# into the Node installation's own prefix (.toolchain/node/lib/node_modules)
# instead of .toolchain/npm-global. That is not merely untidy: `rm -rf
# .toolchain/node` — the normal way to re-bootstrap Node — would silently delete
# the globally installed CLIs with it, and the two install paths would disagree
# depending on which script you happened to run.
export npm_config_prefix="$YAMMAMAN_ROOT/.toolchain/npm-global"

# --- CLI state, also inside the workspace ------------------------------------
# The GitHub CLI writes ~/.config/gh/hosts.yml on login. That directory is
# outside the sandbox, so `gh auth login` fails with:
#   failed to write config to disk: mkdir /Users/<you>/.config: operation not permitted
# `GH_CONFIG_DIR` is gh's documented override, so authentication lands in the
# workspace instead. It is exported rather than wrapped because it affects
# nothing else.
export GH_CONFIG_DIR="$YAMMAMAN_ROOT/.toolchain/gh-config"
mkdir -p "$GH_CONFIG_DIR" 2>/dev/null || true

# The Vercel CLI has no equivalent override — it resolves paths through
# env-paths, which on macOS is hard-coded to ~/Library/... So it gets a wrapper
# in .toolchain/cli/ that redirects HOME for that one process (see
# scripts/bootstrap-clis.sh). That directory is added to PATH above, ahead of
# npm-global/bin so the wrapper wins over the raw symlink.

# --- project binaries (tsc, vite, storybook, prisma, vitest …) ---------------
_realbin="$YAMMAMAN_ROOT/node_modules/.bin"
if [ -d "$_realbin" ]; then
  shim="$YAMMAMAN_SHIM/bin"

  # Regenerate only when node_modules/.bin is newer than the last run. Rewriting
  # ~50 files on every shell start is the kind of tax that makes people stop
  # sourcing the script.
  stamp="$shim/.stamp"
  newest="$(find "$_realbin" -maxdepth 1 -type f -newer "$stamp" -print -quit 2>/dev/null)"

  if [ ! -f "$stamp" ] || [ -n "$newest" ]; then
    # Safe now: the -L guard above guarantees $shim is a real directory, not a
    # symlink to the very directory we are regenerating.
    rm -rf "$shim"
    mkdir -p "$shim"
    for entry in "$_realbin"/*; do
      [ -e "$entry" ] || continue
      name="$(basename "$entry")"
      case "$name" in .*) continue ;; esac
      {
        printf '#!/bin/sh\n'
        # Shell-quoted with printf %q: the real path contains a colon and may
        # one day contain a space.
        printf 'exec %s "$@"\n' "$(printf '%q' "$entry")"
      } > "$shim/$name"
      chmod +x "$shim/$name"
    done
    touch "$stamp"
  fi

  export PATH="$shim:$PATH"
fi

unset _realbin shim stamp newest entry name 2>/dev/null

echo "yammaman env ready — node $(node -v 2>/dev/null || echo MISSING), pnpm $(pnpm -v 2>/dev/null || echo MISSING)"
