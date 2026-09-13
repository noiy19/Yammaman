#!/usr/bin/env node
/**
 * check-no-ad-hoc-values.mjs — the tokens-only gate (tech-stack.md, PRD §6.5).
 *
 * WHAT IT ENFORCES
 *   R1  No raw colour literals — #hex, rgb(), hsl() — outside the token layer.
 *   R2  No arbitrary Tailwind values — `bg-[#fff]`, `text-[13px]`, `p-[7px]`.
 *
 * WHY BOTH RULES
 * R2 alone misses inline styles and SVG attributes. R1 alone misses
 * `bg-[var(--whatever)]` and lets a one-off spacing value through, which is the
 * same disease: a value that exists in exactly one place, that no theme can
 * change, and that nobody can find again. Together they make "the theme is the
 * only place values live" true rather than aspirational.
 *
 * WHY AN ALLOWLIST INSTEAD OF NO EXCEPTIONS
 * Tokens have to be DEFINED somewhere. The allowlist below is short, each entry
 * carries its reason, and adding one is a visible diff in review — which is the
 * point. What is not allowed is a component quietly acquiring a hex.
 *
 * Usage: node scripts/check-no-ad-hoc-values.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/**
 * Files permitted to contain raw values. Every entry needs a reason, because
 * "it was easier" is how a design system dies.
 */
const ALLOWLIST = [
  {
    match: (p) => p === 'src/styles/eva.css',
    reason: 'Generated from the vendored EVA JSON. It is Layer 1 — the primitives themselves.',
  },
  {
    match: (p) => p === 'src/styles/brand-kit.css',
    reason: 'The brand kit. Defining the palette is its entire job; a brand kit with no brand values is a contradiction.',
  },
  {
    match: (p) => p.startsWith('design-system/'),
    reason: 'Vendored upstream EVA theme JSON, byte-identical to @muen/dsh-eva-theme.',
  },
  {
    match: (p) => p.startsWith('src/blocks/__fixtures__/'),
    reason: 'Storybook fixtures. The hexes are inside generated placeholder SVGs (swatch imagery), not design values.',
  },
  {
    match: (p) => p === 'src/commerce/fixture.ts',
    reason: 'Fixture commerce client. Same reason: placeholder swatch imagery, deleted when the engine is wired.',
  },
];

const SCAN_ROOTS = ['src', '.storybook'];
const SCAN_FILES = ['index.html'];

const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.html', '.jsx', '.js']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'storybook-static', '.git']);

const RULES = [
  {
    id: 'R1',
    label: 'raw colour literal',
    // #abc / #aabbcc / #aabbccdd, rgb()/rgba(), hsl()/hsla()
    pattern: /(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\()/g,
    advice: 'Use a semantic Tailwind utility (bg-surface, text-ink, text-accent). If no token fits, add one to brand-kit.css — that is a smaller change than it feels like.',
  },
  {
    id: 'R2',
    label: 'arbitrary Tailwind value',
    pattern: /\b[a-z][a-z0-9-]*-\[[^\]]+\]/g,
    advice: 'Name it. Add a token to the @theme block in src/styles/index.css (e.g. --aspect-portrait, --leading-display) and use the generated utility.',
  },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf('.')))) out.push(full);
  }
  return out;
}

const files = [];
for (const root of SCAN_ROOTS) files.push(...walk(join(ROOT, root)));
for (const f of SCAN_FILES) {
  const full = join(ROOT, f);
  if (existsSync(full)) files.push(full);
}

const violations = [];
let allowedHits = 0;

for (const file of files) {
  const relPath = relative(ROOT, file).split(sep).join('/');
  const allowed = ALLOWLIST.find((a) => a.match(relPath));
  if (allowed) {
    allowedHits += 1;
    continue;
  }

  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');

  for (const rule of RULES) {
    lines.forEach((line, i) => {
      // Skip comment lines: a comment explaining why `#140000` is the brand ink
      // is documentation, not a hard-coded value.
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

      rule.pattern.lastIndex = 0;
      const matches = line.match(rule.pattern);
      if (!matches) return;

      violations.push({
        file: relPath,
        line: i + 1,
        rule,
        matches: [...new Set(matches)],
        snippet: trimmed.slice(0, 100),
      });
    });
  }
}

if (violations.length > 0) {
  console.error(
    `\nAd-hoc values FAILED — ${violations.length} violation(s) across ${new Set(violations.map((v) => v.file)).size} file(s):\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule.id} ${v.rule.label}]`);
    console.error(`    ${v.matches.join(', ')}`);
    console.error(`    ${v.snippet}`);
    console.error(`    → ${v.rule.advice}\n`);
  }
  console.error(
    `If a file genuinely must hold raw values, add it to ALLOWLIST in\n` +
      `scripts/check-no-ad-hoc-values.mjs WITH A REASON. The allowlist is\n` +
      `short on purpose; it is a reviewed decision, not an escape hatch.\n`,
  );
  process.exit(1);
}

console.log(
  `Tokens-only OK — scanned ${files.length - allowedHits} file(s), ` +
    `${allowedHits} allowlisted token source(s), ${ALLOWLIST.length} allowlist entries.`,
);
