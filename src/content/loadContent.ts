/**
 * loadContent.ts — content-as-data at runtime.
 *
 * WHY import.meta.glob AND NOT fetch()
 * A fetch at runtime would mean a 404, a loading state, and a blank page the
 * first time someone opens a URL. Globbing at build time means:
 *   - content ships as static JSON, so the storefront is CDN-cacheable and has
 *     no content API to be up;
 *   - a malformed document fails the BUILD, not the visitor;
 *   - adding a page is dropping in a .json file — no route table to edit.
 *
 * The tradeoff is honest: a content edit needs a rebuild to go live. That is
 * exactly the publish flow the PRD describes (FR-10) — content changes go
 * through PR → staging → Nana's sign-off → production. Content that appeared on
 * production without a rebuild would be content that skipped the gate.
 *
 * Content lives OUTSIDE src/ (site-content/) deliberately: it is client-owned
 * data, not source. The client sandbox in the real product is scoped to that
 * directory, and the lane gate in CI uses the same boundary.
 */

import type { PageDoc } from './types';
import { TENANTS, type Tenant } from '../tenant/tenants';

const modules = import.meta.glob<PageDoc>('../../site-content/*/*.json', {
  eager: true,
  import: 'default',
});

interface IndexedPage {
  doc: PageDoc;
  /** Where on disk it came from — used in error messages. */
  source: string;
}

const byTenant = new Map<string, Map<string, IndexedPage>>();
const byPath = new Map<string, IndexedPage>();

function index(): void {
  byTenant.clear();
  byPath.clear();

  for (const [source, doc] of Object.entries(modules)) {
    // site-content/<tenantId>/<pageId>.json
    const parts = source.split('/');
    const tenantIdFromPath = parts[parts.length - 2];
    const tenantId = doc.tenantId;

    if (tenantId !== tenantIdFromPath) {
      throw new Error(
        `${source}: declares tenantId "${tenantId}" but sits in the ` +
          `"${tenantIdFromPath}" directory. Content must not live in another ` +
          `tenant's namespace.`,
      );
    }

    if (!TENANTS.some((t) => t.tenantId === tenantId)) {
      throw new Error(
        `${source}: tenantId "${tenantId}" is not declared in tenants/tenants.json.`,
      );
    }

    if (byPath.has(doc.path)) {
      const other = byPath.get(doc.path)!;
      throw new Error(
        `Two pages claim the path "${doc.path}": ${other.source} and ${source}. ` +
          `Routing is by path, so this is ambiguous.`,
      );
    }

    const page: IndexedPage = { doc, source };
    if (!byTenant.has(tenantId)) byTenant.set(tenantId, new Map());
    byTenant.get(tenantId)!.set(doc.pageId, page);
    byPath.set(doc.path, page);
  }
}

index();

/**
 * Load a page for a tenant, refusing cross-tenant reads.
 *
 * The `tenant` argument is deliberately required and not inferred from the
 * path: a caller that has not decided which surface it is serving should not be
 * able to get content at all.
 */
export function loadPage(
  tenant: Tenant,
  pageId: string,
): PageDoc | undefined {
  const page = byTenant.get(tenant.tenantId)?.get(pageId);
  if (!page) return undefined;
  if (page.doc.tenantId !== tenant.tenantId) {
    throw new Error(
      `Cross-tenant read blocked: tenant "${tenant.tenantId}" requested ` +
        `page "${pageId}" which belongs to "${page.doc.tenantId}".`,
    );
  }
  return page.doc;
}

/** Resolve a site-absolute path to the page that owns it, if any. */
export function loadPageByPath(path: string): PageDoc | undefined {
  return byPath.get(normalisePath(path))?.doc;
}

export function listPages(tenant: Tenant): PageDoc[] {
  return [...(byTenant.get(tenant.tenantId)?.values() ?? [])]
    .map((p) => p.doc)
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function listTenants(): Tenant[] {
  return TENANTS;
}

/** '/' stays '/', everything else drops its trailing slash. */
export function normalisePath(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}
