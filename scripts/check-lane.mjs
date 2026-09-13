#!/usr/bin/env node
/**
 * check-lane.mjs — the lane gate (tech-stack.md, PRD FR-9).
 *
 * THE RULE BEING ENFORCED
 * Client accounts are sandboxed to CONTENT changes only. A client can edit
 * block props, add blocks from the pattern library, and reorder them. Everything
 * else — components, tokens, routing, schema, CI, infrastructure — is Muen-only.
 *
 * That sandbox is a product promise, and a promise enforced only by convention
 * is not enforced. So: classify every changed file into a lane, and REFUSE a
 * change set that spans the client lane and a Muen lane at the same time. A PR
 * that touches both is either two PRs wearing a trenchcoat, or the sandbox
 * leaking — and both want the same answer.
 *
 * THE OVERRIDE IS DELIBERATE, NOT A BACKDOOR
 * Some legitimate changes genuinely span lanes: adding a block type means
 * touching the schema (content contract) AND the component AND the story. That
 * work must carry Muen review. The override names that explicitly, and it is
 * checked into CI config rather than settable by the person opening the PR.
 *
 * USAGE
 *   node scripts/check-lane.mjs                    # diff against the base ref
 *   node scripts/check-lane.mjs --base=origin/dev
 *   node scripts/check-lane.mjs --files=a.json,src/x.ts   # explicit (tests, CI)
 *   node scripts/check-lane.mjs --strict           # fail if git is unavailable
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const filesArg = args.find((a) => a.startsWith('--files='));
const baseArg = args.find((a) => a.startsWith('--base='));

/**
 * Lane definitions. Order matters: the FIRST match wins, so narrower patterns
 * must come before broader ones. Every pattern is a prefix or an exact name —
 * deliberately not glob magic, so a reader can predict the classification of a
 * path by looking at this table.
 */
const LANES = [
  {
    id: 'content',
    label: 'Client lane — content',
    sandbox: true,
    description: 'The client may edit these. Block props, copy, ordering, media references.',
    rules: [
      { kind: 'prefix', value: 'site-content/' },
      { kind: 'prefix', value: 'public/assets/' },
    ],
  },
  {
    id: 'design',
    label: 'Muen lane — design system',
    sandbox: false,
    description: 'Components, tokens, stories. Changes what every client page looks like.',
    rules: [
      { kind: 'prefix', value: 'src/blocks/' },
      { kind: 'prefix', value: 'src/components/' },
      { kind: 'prefix', value: 'src/styles/' },
      { kind: 'prefix', value: 'src/theme/' },
      { kind: 'prefix', value: '.storybook/' },
      { kind: 'prefix', value: 'design-system/' },
    ],
  },
  {
    id: 'infra',
    label: 'Muen lane — infrastructure',
    sandbox: false,
    description: 'CI, schema, tenants, deploy config, migrations.',
    rules: [
      { kind: 'prefix', value: '.github/' },
      { kind: 'prefix', value: 'tenants/' },
      { kind: 'prefix', value: 'content/schema/' },
      { kind: 'prefix', value: 'prisma/' },
      { kind: 'exact', value: 'vercel.json' },
      { kind: 'exact', value: 'package.json' },
      { kind: 'prefix', value: 'scripts/' },
    ],
  },
  {
    id: 'docs',
    label: 'Neutral — documentation',
    sandbox: false,
    neutral: true,
    description: 'Prose. Belongs to no sandbox and gates nothing.',
    rules: [
      { kind: 'suffix', value: '.md' },
      { kind: 'prefix', value: 'docs/' },
    ],
  },
  {
    id: 'functionality',
    label: 'Muen lane — functionality',
    sandbox: false,
    description: 'Application code, routing, config, build. The catch-all for source.',
    rules: [
      { kind: 'prefix', value: 'src/' },
      { kind: 'exact', value: 'index.html' },
      { kind: 'exact', value: 'vite.config.ts' },
      { kind: 'prefix', value: 'tsconfig' },
      { kind: 'exact', value: 'eslint.config.js' },
      { kind: 'exact', value: 'pnpm-lock.yaml' },
      { kind: 'exact', value: '.env.example' },
    ],
  },
];

function classify(path) {
  for (const lane of LANES) {
    for (const rule of lane.rules) {
      if (rule.kind === 'prefix' && path.startsWith(rule.value)) return lane;
      if (rule.kind === 'exact' && path === rule.value) return lane;
      if (rule.kind === 'suffix' && path.endsWith(rule.value)) return lane;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Determine the changed files
// ---------------------------------------------------------------------------
function gitChangedFiles(base) {
  const run = (a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
  const mergeBase = run(['merge-base', 'HEAD', base]);
  const out = run(['diff', '--name-only', '--diff-filter=ACMR', mergeBase, 'HEAD']);
  return out ? out.split('\n').filter(Boolean) : [];
}

let changed = [];
let source = '';

if (filesArg) {
  changed = filesArg
    .slice('--files='.length)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  source = 'explicit --files';
} else {
  const base = baseArg ? baseArg.slice('--base='.length) : (process.env.LANE_BASE ?? 'origin/main');
  try {
    changed = gitChangedFiles(base);
    source = `git diff ${base}...HEAD`;
  } catch (error) {
    const message = String(error.stderr || error.message || error).trim().split('\n')[0];
    if (strict) {
      console.error(
        `\nLane check FAILED: git is unavailable or "${base}" is not resolvable.\n  ${message}\n`,
      );
      process.exit(1);
    }
    console.log(
      `Lane check SKIPPED — cannot diff against "${base}" (${message}).\n` +
        '  This is expected locally without git. CI runs this with --strict, where an\n' +
        '  unresolvable base is a failure rather than a skip.\n' +
        '  To check a specific change set: node scripts/check-lane.mjs --files=a,b',
    );
    process.exit(0);
  }
}

if (changed.length === 0) {
  console.log('Lane check OK — no changed files in scope.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Classify
// ---------------------------------------------------------------------------
const byLane = new Map(LANES.map((l) => [l.id, []]));
const unclassified = [];

for (const path of changed) {
  const lane = classify(path);
  if (!lane) unclassified.push(path);
  else byLane.get(lane.id).push(path);
}

const touched = LANES.filter((l) => byLane.get(l.id).length > 0);
const meaningful = touched.filter((l) => !l.neutral);
const clientTouched = meaningful.filter((l) => l.sandbox);
const muenTouched = meaningful.filter((l) => !l.sandbox);

console.log(`Lane check — ${changed.length} file(s) from ${source}`);
for (const lane of touched) {
  const files = byLane.get(lane.id);
  console.log(`  ${lane.label}: ${files.length}`);
  for (const f of files.slice(0, 8)) console.log(`    ${f}`);
  if (files.length > 8) console.log(`    … and ${files.length - 8} more`);
}

if (unclassified.length > 0) {
  console.error(
    `\nLane check FAILED — ${unclassified.length} path(s) belong to no lane:\n` +
      unclassified.map((p) => `    ${p}`).join('\n') +
      '\n\n  An unclassified path is one this gate cannot reason about. Add it to the\n' +
      '  appropriate LANES entry in scripts/check-lane.mjs, choosing the lane by\n' +
      '  asking who is allowed to change the file: the client (content) or Muen.\n',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The rule
// ---------------------------------------------------------------------------
const override = process.env.LANE_OVERRIDE === '1';

if (clientTouched.length > 0 && muenTouched.length > 0 && !override) {
  console.error(
    `\nLane check FAILED — this change set spans the client sandbox AND Muen lanes.\n\n` +
      `  Client lane:  ${clientTouched.map((l) => l.id).join(', ')}\n` +
      `  Muen lanes:   ${muenTouched.map((l) => l.id).join(', ')}\n\n` +
      `  PRD FR-9: client accounts are sandboxed to content changes only. A change\n` +
      `  that edits content and code together is either two PRs, or the sandbox\n` +
      `  leaking. Both want the same answer — split it.\n\n` +
      `  If this genuinely must land as one change (for example, adding a new block\n` +
      `  type requires schema + component + story + the content that uses it), it\n` +
      `  needs Muen review. Set LANE_OVERRIDE=1 in the workflow for that labelled PR;\n` +
      `  it is a reviewed decision recorded in CI config, not a flag the author sets.\n`,
  );
  process.exit(1);
}

if (clientTouched.length > 0 && muenTouched.length === 0) {
  console.log(
    '\nLane check OK — content-only change. This is the client sandbox working as\n' +
      'designed: it can ship through the content review path without Muen code review.',
  );
  process.exit(0);
}

const note = override && clientTouched.length > 0 ? ' (override active — Muen review required)' : '';
console.log(`\nLane check OK — no client-sandbox change${note}.`);
