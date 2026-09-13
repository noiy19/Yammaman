#!/usr/bin/env node
/**
 * validate-content.mjs — the JSON/schema gate.
 *
 * Schema validation alone is not enough, because the most damaging content bugs
 * are the ones a per-document schema cannot see. A page can be perfectly valid
 * JSON, perfectly valid against page.schema.json, and still:
 *
 *   - live in another tenant's directory,
 *   - sit at a path outside its tenant's basePath,
 *   - be the second page claiming the same URL,
 *   - link to a page that does not exist,
 *   - start with something other than a hero, so the page has no <h1>.
 *
 * So this script does both: ajv for the shape, then the cross-document rules
 * below. Every failure names the file and says what to do about it.
 *
 * Usage: node scripts/validate-content.mjs
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const errors = [];
const fail = (file, message) => errors.push({ file, message });

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const rel = (p) => relative(ROOT, p) || '.';

// ---------------------------------------------------------------------------
// Load the schemas
// ---------------------------------------------------------------------------
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const tenantsSchema = readJson(join(ROOT, 'content/schema/tenants.schema.json'));
const pageSchema = readJson(join(ROOT, 'content/schema/page.schema.json'));
const validateTenants = ajv.compile(tenantsSchema);
const validatePage = ajv.compile(pageSchema);

function explainAjv(ajvErrors) {
  return (ajvErrors ?? [])
    .map((e) => {
      const where = e.instancePath || '(root)';
      const extra =
        e.keyword === 'additionalProperties'
          ? ` — unexpected key "${e.params.additionalProperty}". The schema is closed on purpose: an unrecognised key is either a typo or a block type nobody built.`
          : e.keyword === 'enum'
            ? ` — allowed: ${e.params.allowedValues.join(', ')}`
            : e.keyword === 'oneOf'
              ? ' — the block did not match exactly one block type (check `type` and that props match that type).'
              : '';
      return `    ${where}: ${e.message}${extra}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Tenants
// ---------------------------------------------------------------------------
const tenantsPath = join(ROOT, 'tenants/tenants.json');
const registry = readJson(tenantsPath);

if (!validateTenants(registry)) {
  fail(
    rel(tenantsPath),
    `does not match tenants.schema.json:\n${explainAjv(validateTenants.errors)}`,
  );
}

const tenants = Array.isArray(registry.tenants) ? registry.tenants : [];
const tenantById = new Map(tenants.map((t) => [t.tenantId, t]));

// basePath must be unique, or tenant resolution is a coin flip.
const byBasePath = new Map();
for (const t of tenants) {
  if (byBasePath.has(t.basePath)) {
    fail(
      rel(tenantsPath),
      `basePath "${t.basePath}" is claimed by both "${byBasePath.get(t.basePath)}" and "${t.tenantId}". Tenant resolution is longest-prefix match, so two surfaces at the same prefix is unresolvable.`,
    );
  }
  byBasePath.set(t.basePath, t.tenantId);

  if (t.parentTenantId !== null && !tenantById.has(t.parentTenantId)) {
    fail(
      rel(tenantsPath),
      `tenant "${t.tenantId}" names parentTenantId "${t.parentTenantId}", which is not a declared tenant.`,
    );
  }

  if (!existsSync(join(ROOT, t.contentDir))) {
    fail(
      rel(tenantsPath),
      `tenant "${t.tenantId}" points at contentDir "${t.contentDir}", which does not exist. Create the directory or fix the path.`,
    );
  }
}

const primary = tenants.filter((t) => t.parentTenantId === null);
if (primary.length !== 1) {
  fail(
    rel(tenantsPath),
    `exactly one tenant must have parentTenantId: null (the primary surface); found ${primary.length}.`,
  );
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
const siteContentDir = join(ROOT, 'site-content');
const pageFiles = [];

if (!existsSync(siteContentDir)) {
  fail('site-content', 'directory is missing.');
} else {
  for (const tenantDir of readdirSync(siteContentDir)) {
    const full = join(siteContentDir, tenantDir);
    if (!statSync(full).isDirectory()) continue;
    for (const entry of readdirSync(full)) {
      if (entry.endsWith('.json')) pageFiles.push(join(full, entry));
    }
  }
}

if (pageFiles.length === 0) {
  fail('site-content', 'no page documents found — the site would render nothing.');
}

/** path -> file, so a duplicate path can name both sides. */
const pathOwners = new Map();
/** `${tenantId}/${pageId}` -> file */
const pageById = new Map();
/** tenantId -> Set(pageId) */
const pagesByTenant = new Map();
/** Every site-absolute path that exists, for link checking. */
const knownPaths = new Set();

const parsedPages = [];

for (const file of pageFiles.sort()) {
  const r = rel(file);
  let doc;
  try {
    doc = readJson(file);
  } catch (error) {
    fail(r, `is not valid JSON: ${error.message}`);
    continue;
  }

  parsedPages.push({ file, doc, r });

  if (!validatePage(doc)) {
    fail(r, `does not match page.schema.json:\n${explainAjv(validatePage.errors)}`);
    continue;
  }

  // --- tenantId must match the directory it sits in -------------------------
  const dirTenant = file.split('/').slice(-2)[0];
  if (doc.tenantId !== dirTenant) {
    fail(
      r,
      `declares tenantId "${doc.tenantId}" but lives in the "${dirTenant}" directory. Content must not sit in another tenant's namespace — this is the isolation rule from PRD §7.`,
    );
  }

  const tenant = tenantById.get(doc.tenantId);
  if (!tenant) {
    fail(r, `tenantId "${doc.tenantId}" is not declared in tenants/tenants.json.`);
    continue;
  }

  // --- path must fall inside the owning tenant's basePath -------------------
  const inBase =
    tenant.basePath === '/'
      ? doc.path === '/' || !doc.path.startsWith('/mill')
      : doc.path === tenant.basePath || doc.path.startsWith(`${tenant.basePath}/`);

  if (!inBase) {
    fail(
      r,
      `path "${doc.path}" is outside tenant "${tenant.tenantId}" basePath "${tenant.basePath}". The brand surface owns '/', so a mill page at a bare path would render under the brand's chrome.`,
    );
  }

  // --- duplicate paths ------------------------------------------------------
  if (pathOwners.has(doc.path)) {
    fail(
      r,
      `path "${doc.path}" is already claimed by ${pathOwners.get(doc.path)}. Routing is by path, so this is ambiguous.`,
    );
  } else {
    pathOwners.set(doc.path, r);
  }
  knownPaths.add(doc.path);

  // --- pageId uniqueness within a tenant ------------------------------------
  const idKey = `${doc.tenantId}/${doc.pageId}`;
  if (pageById.has(idKey)) {
    fail(
      r,
      `pageId "${doc.pageId}" is already used by ${pageById.get(idKey)} in tenant "${doc.tenantId}". Ids are stable config (PRD FR-12) and must be unique per tenant.`,
    );
  }
  pageById.set(idKey, r);

  if (!pagesByTenant.has(doc.tenantId)) pagesByTenant.set(doc.tenantId, new Set());
  pagesByTenant.get(doc.tenantId).add(doc.pageId);

  // --- block ids unique within the page -------------------------------------
  const seenBlockIds = new Set();
  for (const block of doc.blocks) {
    if (seenBlockIds.has(block.id)) {
      fail(r, `block id "${block.id}" appears more than once. Ids key React lists and anchor links.`);
    }
    seenBlockIds.add(block.id);
  }

  // --- the first block must be a hero, so the page has an <h1> --------------
  const first = doc.blocks[0];
  if (first && first.type !== 'hero') {
    fail(
      r,
      `first block is "${first.type}", expected "hero". The hero owns the page's <h1>; without it the document has no top-level heading, which the a11y gate treats as a violation.`,
    );
  }
}

// --- tenant defaultPageId must resolve ---------------------------------------
for (const t of tenants) {
  const pages = pagesByTenant.get(t.tenantId);
  if (!pages || !pages.has(t.defaultPageId)) {
    fail(
      rel(tenantsPath),
      `tenant "${t.tenantId}" defaultPageId "${t.defaultPageId}" has no matching page document.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Link integrity
// ---------------------------------------------------------------------------
/**
 * Site paths that are deliberately NOT content pages. Anything here is owned by
 * a route that is not built from site-content — a cart, a checkout, an account
 * area. Keep this list short and justified; it is the one place a link is
 * allowed to point at nothing in particular.
 */
const NON_CONTENT_ROUTES = new Set([
  '/cart',
  '/checkout',
  '/account',
  '/order-confirmation',
]);

function collectHrefs(block) {
  const hrefs = [];
  const p = block.props ?? {};

  if (p.cta && typeof p.cta.href === 'string') hrefs.push(p.cta.href);
  if (Array.isArray(p.channels)) {
    for (const c of p.channels) if (c && typeof c.href === 'string') hrefs.push(c.href);
  }
  if (Array.isArray(p.stores)) {
    for (const s of p.stores) if (s && typeof s.mapHref === 'string') hrefs.push(s.mapHref);
  }
  return hrefs;
}

for (const { doc, r } of parsedPages) {
  for (const block of doc.blocks) {
    for (const href of collectHrefs(block)) {
      if (!href.startsWith('/')) continue; // external https — not ours to verify
      const path = href === '/' ? '/' : href.replace(/\/$/, '');
      if (knownPaths.has(path) || NON_CONTENT_ROUTES.has(path)) continue;

      const suggestion = [...knownPaths]
        .sort()
        .map((p) => `      ${p}`)
        .join('\n');
      fail(
        r,
        `block "${block.id}" links to "${href}", which is not a page. Internal links must resolve — a dead link in content is invisible to every other gate.\n    Known paths:\n${suggestion}`,
      );
    }
  }
}

/**
 * Local image paths must resolve on disk.
 *
 * Same reasoning as the link check above: a broken image is invisible to every
 * other gate. The schema proves `src` is a non-empty string, TypeScript proves it
 * is a string, and neither has any idea whether the file exists. It surfaces as a
 * grey box on staging and, if nobody looks at that page, on production.
 *
 * Only site-absolute paths are checked. Absolute https URLs are someone else's
 * uptime, and `data:` URIs are self-contained.
 *
 * `publicId` needs no equivalent check: it is resolved through Cloudinary at
 * delivery time, so a missing asset is a Cloudinary concern, not a repository
 * one. That is precisely why content uses `publicId` for real imagery — see
 * src/media/cloudinary.ts.
 */
function collectLocalImagePaths(block) {
  const paths = [];
  const p = block.props ?? {};

  // Today the only block props carrying a `media` object are `hero` and
  // `figure`, both under `image`. Adding a block that holds an image means
  // adding it here — the check is per-block on purpose, because guessing at
  // arbitrary nesting is how an asset check silently stops covering new blocks.
  const candidates = [p.image];

  for (const media of candidates) {
    if (media && typeof media.src === 'string' && media.src.startsWith('/')) {
      paths.push(media.src);
    }
  }
  return paths;
}

const missingAssets = new Map();

for (const { doc, r } of parsedPages) {
  for (const block of doc.blocks) {
    for (const src of collectLocalImagePaths(block)) {
      const onDisk = join(ROOT, 'public', src.replace(/^\//, ''));
      if (existsSync(onDisk)) continue;
      if (!missingAssets.has(src)) missingAssets.set(src, []);
      missingAssets.get(src).push({ file: r, block: block.id });
    }
  }
}

for (const [src, uses] of missingAssets) {
  const where = uses.map((u) => `block "${u.block}" in ${u.file}`).join(', ');
  fail(
    src,
    `local image does not exist on disk (referenced by ${where}).\n` +
      `    Expected: public${src}\n` +
      `    Either add the file, or use a Cloudinary \`publicId\` instead — that is the\n` +
      `    intended path for real imagery (see src/media/cloudinary.ts).`,
  );
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (errors.length > 0) {
  console.error(`\nContent validation FAILED — ${errors.length} problem(s):\n`);
  for (const { file, message } of errors) {
    console.error(`  ${file}\n    ${message}\n`);
  }
  process.exit(1);
}

console.log(
  `Content OK — ${parsedPages.length} page(s) across ${tenants.length} tenant(s), ` +
    `${knownPaths.size} route(s), all internal links resolve, ` +
    `all local image paths exist on disk.`,
);
