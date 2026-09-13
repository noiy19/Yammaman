#!/usr/bin/env node
/**
 * check-contrast.mjs — the WCAG AA gate (PRD §6.5).
 *
 * WHY THIS IS NOT A LINT RULE
 * Contrast is not a property of a file, it is a property of a PAIR of tokens as
 * they resolve after the cascade, in a specific theme. A colour can be perfectly
 * accessible on the page background and fail badly on the inverted band. So this
 * script does not pattern-match CSS — it resolves the real token graph:
 *
 *     --dsw-alias-label-primary
 *       → var(--yy-ink-900)          (brand kit re-points the alias)
 *       → #140000                    (brand primitive)
 *
 * …for BOTH themes, then computes the WCAG contrast ratio for each pair the
 * design actually renders.
 *
 * That means changing one value in brand-kit.css is checked against every
 * surface it touches, in both themes, without anyone remembering to look.
 *
 * It supports the three value forms the token layer uses: hex, var() chains, and
 * color-mix(in srgb, A p%, B) — parsed with a real top-level-split so nested
 * color-mix (which EVA uses heavily) resolves correctly.
 *
 * Usage: node scripts/check-contrast.mjs [--verbose]
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const VERBOSE = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------
// Parse custom properties out of the stylesheets
// ---------------------------------------------------------------------------
const DARK_SELECTOR = 'data-ds-dark-theme';
const SHEETS = ['src/styles/eva.css', 'src/styles/brand-kit.css'];

function parseSheet(relPath) {
  const path = join(ROOT, relPath);
  if (!existsSync(path)) {
    console.error(`Contrast check cannot run: ${relPath} is missing.`);
    process.exit(1);
  }
  // Strip comments BEFORE parsing declarations. Without this, a declaration
  // that immediately follows a comment inside a block is glued to it, fails the
  // `^\s*--name:` anchor, and is silently dropped — which reads downstream as
  // "undefined token" for a token that is plainly there in the file.
  const css = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  const blocks = [];
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    const decls = {};
    for (const part of body.split(';')) {
      const d = part.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/s);
      if (d) decls[d[1]] = d[2].trim();
    }
    blocks.push({ selector, decls, file: relPath });
  }
  return blocks;
}

const allBlocks = SHEETS.flatMap(parseSheet);

/**
 * Cascade model, stated explicitly because getting it wrong is silent.
 *
 *   LIGHT  — a block contributes only if its selector LIST has a part that is
 *            not the dark override. A `:root, [data-ds-dark-theme]` block
 *            therefore contributes its `:root` half, which is the whole reason
 *            brand-kit.css can state its aliases once.
 *
 *   DARK   — every block contributes, in source order. In a dark theme BOTH
 *            `:root` and `[data-ds-dark-theme='true']` match the same element at
 *            equal specificity, so source order alone decides. Building dark as
 *            "light, then only the dark blocks" would apply EVA's dark aliases
 *            AFTER the brand kit re-pointed them and quietly serve EVA's palette.
 */
function selectorParts(selector) {
  return selector.split(',').map((s) => s.trim()).filter(Boolean);
}

const lightVars = {};
for (const b of allBlocks) {
  const parts = selectorParts(b.selector);
  const hasLightPart = parts.some((s) => !s.includes(DARK_SELECTOR));
  if (hasLightPart) Object.assign(lightVars, b.decls);
}

const darkVars = {};
for (const b of allBlocks) Object.assign(darkVars, b.decls);

// ---------------------------------------------------------------------------
// Colour resolution
// ---------------------------------------------------------------------------

/** Split on commas that are not inside parentheses. */
function splitTopLevel(input) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of input) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseHex(hex) {
  const h = hex.length <= 4
    ? hex.split('').map((c) => c + c).join('')
    : hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function resolve(value, vars, depth = 0) {
  if (depth > 32) throw new Error(`token chain too deep at "${value}"`);
  const v = value.trim();

  const asVar = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (asVar) {
    const next = vars[asVar[1]];
    if (next === undefined) throw new Error(`undefined token ${asVar[1]}`);
    return resolve(next, vars, depth + 1);
  }

  if (v.startsWith('color-mix')) {
    const open = v.indexOf('(');
    const inner = v.slice(open + 1, v.lastIndexOf(')'));
    const args = splitTopLevel(inner);
    if (args.length !== 3 || !/^in\s+srgb$/i.test(args[0])) {
      throw new Error(`unsupported color-mix: ${v}`);
    }
    // Each stop is "<colour>" or "<colour> <pct>%". The trailing % anchors the
    // match, so a nested color-mix in the colour position still parses. CSS
    // permits omitting ONE percentage (the other becomes 100% minus it) and
    // omitting both (50/50), so a stop's percentage is optional rather than
    // required — getting this wrong reports "unsupported color-mix stop" for
    // `color-mix(in srgb, X 32%, transparent)`, which is legal and is exactly
    // how every border token is written.
    const stop = (s) => {
      const sm = s.match(/^(.+?)\s+([\d.]+)%$/s);
      if (sm) {
        return { color: resolve(sm[1], vars, depth + 1), pct: parseFloat(sm[2]) / 100 };
      }
      return { color: resolve(s, vars, depth + 1), pct: null };
    };

    const a = stop(args[1]);
    const b = stop(args[2]);

    let wa;
    let wb;
    if (a.pct !== null && b.pct !== null) {
      wa = a.pct;
      wb = b.pct;
    } else if (a.pct !== null) {
      wa = a.pct;
      wb = 1 - a.pct;
    } else if (b.pct !== null) {
      wb = b.pct;
      wa = 1 - b.pct;
    } else {
      wa = 0.5;
      wb = 0.5;
    }
    const total = wa + wb || 1;
    wa /= total;
    wb /= total;

    // Blend in PREMULTIPLIED alpha, which is what CSS color-mix specifies.
    //
    // Averaging the channels directly is the obvious-looking mistake and it is
    // wrong for exactly the case this token layer uses everywhere:
    // `color-mix(in srgb, #140000 32%, transparent)` must keep #140000's hue
    // and simply become 32% opaque. Straight averaging instead drags the colour
    // toward transparent's black, so the border renders darker than CSS would
    // render it and the computed contrast is wrong in the pessimistic
    // direction. Premultiplying, summing, then un-premultiplying is correct.
    const pa = { r: a.color.r * a.color.a * wa, g: a.color.g * a.color.a * wa, b: a.color.b * a.color.a * wa, a: a.color.a * wa };
    const pb = { r: b.color.r * b.color.a * wb, g: b.color.g * b.color.a * wb, b: b.color.b * b.color.a * wb, a: b.color.a * wb };
    const alpha = pa.a + pb.a;

    return {
      r: alpha ? (pa.r + pb.r) / alpha : 0,
      g: alpha ? (pa.g + pb.g) / alpha : 0,
      b: alpha ? (pa.b + pb.b) / alpha : 0,
      a: alpha,
    };
  }

  const hex = v.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) return parseHex(hex[1]);

  // Keyword colours used by the token layer. `transparent` matters: the border
  // tokens are color-mix(... , transparent), and without it every border check
  // reports "unsupported color-mix stop" instead of a ratio.
  const KEYWORDS = {
    transparent: { r: 0, g: 0, b: 0, a: 0 },
    white: { r: 255, g: 255, b: 255, a: 1 },
    black: { r: 0, g: 0, b: 0, a: 1 },
  };
  if (KEYWORDS[v.toLowerCase()]) return { ...KEYWORDS[v.toLowerCase()] };

  const fn = v.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = splitTopLevel(fn[1]);
    return {
      r: parseFloat(parts[0]),
      g: parseFloat(parts[1]),
      b: parseFloat(parts[2]),
      a: parts[3] === undefined ? 1 : parseFloat(parts[3]),
    };
  }

  throw new Error(`cannot resolve colour value: ${v}`);
}

/** Alpha-composite a possibly-translucent colour over an opaque background. */
function over(fg, bg) {
  if (fg.a >= 1) return fg;
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(over(fg, bg));
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const toHex = (c) =>
  '#' + [c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');

// ---------------------------------------------------------------------------
// The pairs the design actually renders
// ---------------------------------------------------------------------------
/**
 * min: WCAG 2.1 AA. 4.5 for normal text; 3.0 for large text (>=24px, or
 * >=18.66px bold) and for non-text UI boundaries.
 *
 * Several entries are checked at BOTH levels deliberately: `label-dimmed` is
 * used on small print, so it must clear 4.5 even though it is a "quiet" colour.
 * Quiet is a design intent; unreadable is a bug, and they are one shade apart.
 *
 * WHAT IS DELIBERATELY NOT GATED, AND WHY
 * `border-l1` and `border-l2` are not here. They are decorative rules — the line
 * under a header, the divider between list items. WCAG 1.4.11 applies to
 * boundaries that are "required to identify" a control, and forcing these to 3:1
 * would mean every hairline in the design becomes a heavy rule, which is a real
 * accessibility cost (visual noise) traded for no accessibility gain.
 *
 * `border-l3` IS gated, because "strong border" is the token a form control or
 * an active state would reach for. If nothing uses it yet, that is exactly when
 * it is cheap to hold it to the standard.
 */
const PAIRS = [
  { fg: '--dsw-alias-label-primary', bg: '--dsw-alias-bg-base', min: 4.5, use: 'body text on the page' },
  { fg: '--dsw-alias-label-primary', bg: '--dsw-alias-bg-layer-2', min: 4.5, use: 'body text on a raised surface' },
  { fg: '--dsw-alias-label-secondary', bg: '--dsw-alias-bg-base', min: 4.5, use: 'secondary copy' },
  { fg: '--dsw-alias-label-tertiary', bg: '--dsw-alias-bg-base', min: 4.5, use: 'tertiary copy' },
  { fg: '--dsw-alias-label-dimmed', bg: '--dsw-alias-bg-base', min: 4.5, use: 'small print / captions' },
  { fg: '--dsw-alias-label-primary', bg: '--dsw-alias-bg-layer-3', min: 4.5, use: 'text on a sunken band' },
  { fg: '--dsw-alias-link', bg: '--dsw-alias-bg-base', min: 4.5, use: 'inline links' },
  { fg: '--dsw-alias-link', bg: '--dsw-alias-bg-layer-2', min: 4.5, use: 'links on a raised surface' },
  { fg: '--dsw-alias-state-success-primary', bg: '--dsw-alias-bg-base', min: 4.5, use: 'success text (fabric in stock)' },
  { fg: '--dsw-alias-state-warn-primary', bg: '--dsw-alias-bg-base', min: 4.5, use: 'warning text' },
  { fg: '--dsw-alias-state-error-primary', bg: '--dsw-alias-bg-base', min: 4.5, use: 'error text (form + unknown block)' },
  { fg: '--dsw-alias-brand-text', bg: '--dsw-alias-brand-primary', min: 4.5, use: 'button label on the brand fill' },
  { fg: '--dsw-alias-label-primary-inverted', bg: '--dsw-alias-brand-primary', min: 4.5, use: 'text on the inverted band' },
  { fg: '--dsw-alias-border-l3', bg: '--dsw-alias-bg-base', min: 3.0, use: 'strong border', nonText: true },
  // The focus ring is `--color-focus`, which aliases brand-primary. WCAG 2.4.11
  // treats a focus indicator as a non-text component: 3:1 against its adjacent
  // colours. Checked so a brand change cannot make focus invisible.
  { fg: '--dsw-alias-brand-primary', bg: '--dsw-alias-bg-base', min: 3.0, use: 'focus ring', nonText: true },
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const failures = [];
const rows = [];

for (const theme of ['light', 'dark']) {
  const vars = theme === 'light' ? lightVars : darkVars;

  for (const pair of PAIRS) {
    let fg;
    let bg;
    try {
      bg = resolve(`var(${pair.bg})`, vars);
      fg = resolve(`var(${pair.fg})`, vars);
    } catch (error) {
      failures.push({
        theme,
        pair,
        reason: `could not resolve tokens: ${error.message}`,
      });
      continue;
    }

    const ratio = contrastRatio(fg, bg);
    const pass = ratio >= pair.min;
    rows.push({ theme, pair, ratio, pass, fg: toHex(over(fg, bg)), bg: toHex(bg) });
    if (!pass) failures.push({ theme, pair, ratio });
  }
}

if (VERBOSE) {
  console.log('\n  theme  ratio   min   result  pair');
  console.log('  ' + '-'.repeat(78));
  for (const r of rows) {
    console.log(
      `  ${r.theme.padEnd(6)} ${r.ratio.toFixed(2).padStart(5)}  ${r.pair.min.toFixed(1)}  ` +
        `${(r.pass ? 'pass' : 'FAIL').padEnd(7)} ${r.pair.fg} on ${r.pair.bg}`,
    );
  }
  console.log('');
}

if (failures.length > 0) {
  console.error(
    `\nContrast FAILED — ${failures.length} pair(s) below WCAG AA:\n`,
  );
  for (const f of failures) {
    if (f.reason) {
      console.error(`  [${f.theme}] ${f.pair.fg} on ${f.pair.bg}\n    ${f.reason}\n`);
      continue;
    }
    console.error(
      `  [${f.theme}] ${f.pair.fg} on ${f.pair.bg}\n` +
        `    ${f.ratio.toFixed(2)}:1, needs ${f.pair.min.toFixed(1)}:1 — ${f.pair.use}\n` +
        `    Fix in src/styles/brand-kit.css: adjust the --yy-* primitive this alias\n` +
        `    points at. Do not fix it at the call site.\n`,
    );
  }
  process.exit(1);
}

const worst = rows.reduce((a, b) => (a.ratio < b.ratio ? a : b));
console.log(
  `Contrast OK — ${rows.length} pair(s) x 2 themes clear WCAG AA. ` +
    `Tightest: ${worst.ratio.toFixed(2)}:1 (${worst.theme}, ${worst.pair.use}).`,
);
