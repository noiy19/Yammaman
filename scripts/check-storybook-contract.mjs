#!/usr/bin/env node
/**
 * check-storybook-contract.mjs — the "Storybook as visual contract" gate.
 *
 * THE THREE LISTS THAT MUST AGREE
 *   1. content/schema/page.schema.json  — what a content document may SAY
 *   2. src/blocks/registry.ts           — what the code can RENDER
 *   3. src/blocks/*.stories.tsx         — what a human has actually LOOKED AT
 *
 * Any two of these agreeing is not enough, and each pairwise failure is a
 * different real bug:
 *
 *   schema + registry, no story  → a client can author a block nobody has ever
 *                                  seen rendered. It ships unreviewed.
 *   schema + story, no registry  → content validates, then renders the
 *                                  "Unknown block type" alert on production.
 *   registry + story, no schema  → a component exists that content can never
 *                                  use. Dead code that still needs maintaining.
 *
 * WHY PARSE INSTEAD OF IMPORT
 * This runs in CI before a build, on plain Node, with no TypeScript loader. The
 * files are parsed as text with patterns anchored to the conventions the
 * codebase already follows. If a convention changes, this gate fails loudly —
 * which is the intended behaviour, not a nuisance: the conventions ARE the
 * contract.
 *
 * Usage: node scripts/check-storybook-contract.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const problems = [];

// ---------------------------------------------------------------------------
// 1. The schema's block types
// ---------------------------------------------------------------------------
const schemaPath = join(ROOT, 'content/schema/page.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const oneOf = schema.definitions?.block?.oneOf;
if (!Array.isArray(oneOf) || oneOf.length === 0) {
  problems.push(
    'content/schema/page.schema.json: definitions.block.oneOf is missing or empty. ' +
      'That list IS the set of block types content may use.',
  );
}

const schemaTypes = new Set();
for (const entry of oneOf ?? []) {
  const ref = entry.$ref ?? '';
  const name = ref.replace('#/definitions/', '');
  const def = schema.definitions?.[name];
  const typeConst = def?.properties?.type?.const;
  if (!typeConst) {
    problems.push(
      `content/schema/page.schema.json: block variant "${name}" has no properties.type.const, ` +
        'so its discriminator cannot be read. Every block variant needs one.',
    );
    continue;
  }
  schemaTypes.add(typeConst);
}

// ---------------------------------------------------------------------------
// 2. The registry
// ---------------------------------------------------------------------------
const registryPath = join(ROOT, 'src/blocks/registry.ts');
const registrySource = readFileSync(registryPath, 'utf8');
const registryMatch = registrySource.match(
  /export const BLOCK_REGISTRY\s*=\s*\{([\s\S]*?)\}\s*satisfies/,
);

if (!registryMatch) {
  problems.push(
    'src/blocks/registry.ts: could not find `export const BLOCK_REGISTRY = { … } satisfies …`. ' +
      'The contract gate reads that literal; keep the shape.',
  );
}

const registryTypes = new Set(
  [...(registryMatch?.[1] ?? '').matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)].map((m) => m[1]),
);

// ---------------------------------------------------------------------------
// 3. The stories
// ---------------------------------------------------------------------------
const blocksDir = join(ROOT, 'src/blocks');
const storyFiles = existsSync(blocksDir)
  ? readdirSync(blocksDir).filter((f) => f.endsWith('.stories.tsx'))
  : [];

/** type -> { file, stories: string[] } */
const storyTypes = new Map();

for (const file of storyFiles) {
  const source = readFileSync(join(blocksDir, file), 'utf8');
  const titleMatch = source.match(/title:\s*['"]Blocks\/([A-Za-z0-9_$]+)['"]/);

  if (!titleMatch) {
    problems.push(
      `src/blocks/${file}: no \`title: 'Blocks/<type>'\`. Every block story must declare its ` +
        'block type in the title, because that string is how this gate ties the story to the schema.',
    );
    continue;
  }

  const type = titleMatch[1];

  // Named story exports, excluding the default meta export.
  const stories = [
    ...source.matchAll(/^export const ([A-Za-z0-9_$]+)\s*:\s*Story\b/gm),
  ].map((m) => m[1]);

  if (stories.length === 0) {
    problems.push(
      `src/blocks/${file}: declares title 'Blocks/${type}' but exports no stories. ` +
        'A title with no story is a placeholder, not a contract.',
    );
  }

  if (storyTypes.has(type)) {
    problems.push(
      `Two story files claim 'Blocks/${type}': ${storyTypes.get(type).file} and ${file}. ` +
        'One block type, one stories file.',
    );
  }

  storyTypes.set(type, { file, stories });
}

// ---------------------------------------------------------------------------
// Cross-check
// ---------------------------------------------------------------------------
const all = [...new Set([...schemaTypes, ...registryTypes, ...storyTypes.keys()])].sort();

for (const type of all) {
  const inSchema = schemaTypes.has(type);
  const inRegistry = registryTypes.has(type);
  const inStories = storyTypes.has(type);

  if (inSchema && inRegistry && inStories) continue;

  const missing = [
    !inSchema && 'the content schema (page.schema.json)',
    !inRegistry && 'the block registry (src/blocks/registry.ts)',
    !inStories && 'a Storybook story (src/blocks/*.stories.tsx)',
  ].filter(Boolean);

  let advice;
  if (inSchema && inRegistry && !inStories) {
    advice =
      `Add src/blocks/<Component>.stories.tsx with title 'Blocks/${type}'. ` +
      'Until it has a story, nobody has seen this block rendered and the client can still author it.';
  } else if (inSchema && !inRegistry) {
    advice =
      `The schema lets content use "${type}" but nothing renders it — on production this becomes the ` +
      '"Unknown block type" alert. Either add it to BLOCK_REGISTRY or remove it from the schema.';
  } else if (inRegistry && !inSchema) {
    advice =
      `"${type}" is implemented but content can never reference it. Remove it, or add it to ` +
      'page.schema.json (which is the change that makes it available to the client).';
  } else {
    advice = 'Bring all three into agreement.';
  }

  problems.push(
    `Block type "${type}" is missing from ${missing.join(' and ')}.\n    → ${advice}`,
  );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (problems.length > 0) {
  console.error(
    `\nStorybook contract FAILED — ${problems.length} problem(s):\n\n` +
      problems.map((p) => `  ${p}`).join('\n\n') +
      '\n',
  );
  process.exit(1);
}

const storyCount = [...storyTypes.values()].reduce((n, s) => n + s.stories.length, 0);
console.log(
  `Storybook contract OK — ${all.length} block type(s) agree across schema, registry and stories ` +
    `(${storyCount} stories in ${storyTypes.size} file(s)).`,
);
