/**
 * tenants.ts (src/tenant) — the tenant registry as the app sees it.
 *
 * Reads tenants/tenants.json at build time. Vite inlines it, so adding a
 * surface is a config change with no code change.
 *
 * ISOLATION (PRD FR-7, guardrail #1)
 * Every page document carries the tenantId it belongs to. `loadPage` requires
 * the caller to pass the tenant it believes it is serving and REFUSES on
 * mismatch, so a cross-tenant read fails loudly at build/render time instead of
 * quietly rendering HARAPPA content on the YAMMA site. The real product
 * enforces this in the data layer; this is the same rule stated at the edge,
 * which is what makes the two-tenant demo (acceptance criterion #4) meaningful.
 */

import registry from '../../tenants/tenants.json';

export interface Tenant {
  tenantId: string;
  surface: 'brand' | 'mill';
  name: string;
  basePath: string;
  contentDir: string;
  parentTenantId: string | null;
  defaultPageId: string;
  /** Site paths in nav order. Absent = path order. */
  navOrder?: string[];
  /** The client's other properties, linked from the header. */
  externalLinks?: { label: string; href: string }[];
  /** The header's primary CTA. Shown on every page. */
  headerCta?: { label: string; href: string };
  /** The mill's own social accounts, shown in the footer. */
  socialLinks?: { label: string; href: string }[];
  /** The account entry point shown in the header. */
  signIn?: { label: string; href: string };
}

export const CLIENT = registry.client;
export const TENANTS: Tenant[] = registry.tenants as Tenant[];

/** The primary surface — owns '/'. */
export const PRIMARY_TENANT_ID =
  TENANTS.find((t) => t.parentTenantId === null)?.tenantId ?? TENANTS[0].tenantId;

export function getTenant(tenantId: string): Tenant {
  const found = TENANTS.find((t) => t.tenantId === tenantId);
  if (!found) {
    throw new Error(
      `Unknown tenant "${tenantId}". Known tenants: ${TENANTS.map((t) => t.tenantId).join(', ')}`,
    );
  }
  return found;
}

/**
 * Longest-prefix match, so '/' cannot swallow '/mill'.
 * The brand surface owns '/', which prefixes everything — matching tenants in
 * descending basePath length is what stops the mill being served the brand's
 * pages.
 */
export function tenantForPath(pathname: string): Tenant {
  const normalised = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const candidates = [...TENANTS].sort(
    (a, b) => b.basePath.length - a.basePath.length,
  );
  for (const tenant of candidates) {
    const base = tenant.basePath.endsWith('/')
      ? tenant.basePath
      : `${tenant.basePath}/`;
    if (tenant.basePath === '/' || normalised.startsWith(base)) return tenant;
  }
  return getTenant(PRIMARY_TENANT_ID);
}

/** Strip the tenant prefix to get the page's route within its own surface. */
export function pagePathWithinTenant(tenant: Tenant, pathname: string): string {
  if (tenant.basePath === '/') return pathname;
  const rest = pathname.slice(tenant.basePath.length);
  return rest === '' ? '/' : rest;
}
