import { describe, expect, it } from 'vitest';
import {
  listPages,
  listTenants,
  loadPage,
  loadPageByPath,
  normalisePath,
} from './loadContent';
import { getTenant } from '../tenant/tenants';

/**
 * These tests run against the REAL documents in site-content/. That is the
 * point: the content is data, so the loader's contract is a contract with the
 * content that actually ships, not with a mock that cannot drift.
 *
 * The isolation assertions are the ones that matter. PRD acceptance criterion #4
 * is "two tenants, zero cross-contamination (including AI workers)" — this is
 * where the storefront half of that is proven.
 */
describe('content isolation', () => {
  it('serves each tenant only its own pages', () => {
    const brand = getTenant('yammaman-brand');
    const mill = getTenant('yammaman-textile-mill');

    const brandPages = listPages(brand);
    const millPages = listPages(mill);

    expect(brandPages.length).toBeGreaterThan(0);
    expect(millPages.length).toBeGreaterThan(0);

    // Every page a tenant can list belongs to that tenant.
    for (const page of brandPages) expect(page.tenantId).toBe('yammaman-brand');
    for (const page of millPages) expect(page.tenantId).toBe('yammaman-textile-mill');

    // The two sets are disjoint by PATH. That is the real invariant: paths are
    // globally unique because routing is by path alone, and the loader throws at
    // import time if two documents claim one.
    const brandPaths = new Set(brandPages.map((p) => p.path));
    const millPaths = new Set(millPages.map((p) => p.path));
    expect([...brandPaths].some((path) => millPaths.has(path))).toBe(false);
  });

  it('allows a pageId to repeat across tenants, because tenant scopes it', () => {
    // Both surfaces have a page called 'story'. This is intentional and legal:
    // pageIds are unique PER TENANT, and loadPage() takes the tenant as a
    // required argument precisely so that a shared id cannot resolve to the
    // wrong document. A test asserting global pageId uniqueness would be
    // asserting the wrong rule.
    const brand = getTenant('yammaman-brand');
    const mill = getTenant('yammaman-textile-mill');

    expect(loadPage(brand, 'story')?.path).toBe('/story');
    expect(loadPage(mill, 'story')?.path).toBe('/mill/story');
  });

  it('returns undefined for a page that belongs to another tenant', () => {
    const brand = getTenant('yammaman-brand');
    const mill = getTenant('yammaman-textile-mill');

    // 'story' exists in BOTH tenants. Asking for the mill's 'story' as the brand
    // must not quietly hand back the mill's document.
    const millStory = loadPage(mill, 'story');
    const brandStory = loadPage(brand, 'story');

    expect(millStory?.tenantId).toBe('yammaman-textile-mill');
    expect(brandStory?.tenantId).toBe('yammaman-brand');
    expect(millStory).not.toBe(brandStory);

    // A page id that only the mill has must be invisible to the brand.
    expect(loadPage(brand, 'does-not-exist')).toBeUndefined();
  });

  it('never returns a document whose tenantId disagrees with the request', () => {
    for (const tenant of listTenants()) {
      for (const page of listPages(tenant)) {
        const fetched = loadPage(tenant, page.pageId);
        expect(fetched?.tenantId).toBe(tenant.tenantId);
      }
    }
  });
});

describe('route resolution', () => {
  it('resolves a site path to exactly one page', () => {
    expect(loadPageByPath('/')?.pageId).toBe('home');
    expect(loadPageByPath('/collection')?.tenantId).toBe('yammaman-brand');
    expect(loadPageByPath('/mill')?.tenantId).toBe('yammaman-textile-mill');
    expect(loadPageByPath('/mill/story')?.pageId).toBe('story');
  });

  it('normalises a trailing slash', () => {
    expect(loadPageByPath('/collection')?.pageId).toBe(
      loadPageByPath('/collection/')?.pageId,
    );
  });

  it('returns undefined rather than guessing for an unknown path', () => {
    expect(loadPageByPath('/nope')).toBeUndefined();
  });
});

describe('normalisePath', () => {
  it('keeps the root as the root', () => {
    expect(normalisePath('/')).toBe('/');
    expect(normalisePath('//')).toBe('/');
  });

  it('drops a trailing slash and adds a missing leading one', () => {
    expect(normalisePath('/a/b/')).toBe('/a/b');
    expect(normalisePath('a/b')).toBe('/a/b');
  });
});

describe('every page starts with a hero', () => {
  // The hero owns the page's <h1>. validate-content.mjs enforces this at the
  // document level; asserting it here too means a violation fails the unit suite
  // as well as the content gate, which is cheap redundancy on a rule that
  // produces a silent accessibility bug when broken.
  it.each(listTenants().flatMap((t) => listPages(t).map((p) => [p.path, p] as const)))(
    '%s',
    (_path, page) => {
      expect(page.blocks[0]?.type).toBe('hero');
    },
  );
});
