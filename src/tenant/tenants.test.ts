import { describe, expect, it } from 'vitest';
import { TENANTS, tenantForPath, pagePathWithinTenant, getTenant } from './tenants';

/**
 * Tenant resolution is the load-bearing part of the multitenant promise
 * (PRD FR-7, acceptance criterion #4: "two tenants, zero cross-contamination").
 *
 * The specific hazard: the brand surface owns '/', which is a PREFIX of every
 * path on the site — including '/mill'. A naive `startsWith` loop in declaration
 * order serves HARAPPA content under the YAMMA chrome. These tests pin that
 * behaviour so a future refactor of the resolver cannot quietly reintroduce it.
 */
describe('tenantForPath', () => {
  it('resolves the brand surface at the root', () => {
    expect(tenantForPath('/').tenantId).toBe('yammaman-brand');
  });

  it('resolves brand pages under the root', () => {
    expect(tenantForPath('/collection').tenantId).toBe('yammaman-brand');
    expect(tenantForPath('/how-to-order').tenantId).toBe('yammaman-brand');
    expect(tenantForPath('/faq').tenantId).toBe('yammaman-brand');
  });

  it('resolves the mill surface, and does NOT let "/" swallow it', () => {
    expect(tenantForPath('/mill').tenantId).toBe('yammaman-textile-mill');
    expect(tenantForPath('/mill/story').tenantId).toBe('yammaman-textile-mill');
  });

  it('treats a bare "/mill" without a trailing slash the same as "/mill/"', () => {
    expect(tenantForPath('/mill').tenantId).toBe(
      tenantForPath('/mill/').tenantId,
    );
  });

  it('does not confuse a sibling path that merely starts with the same letters', () => {
    // '/millinery' is not inside '/mill'. Prefix matching must respect the
    // segment boundary, or the mill surface swallows unrelated routes.
    expect(tenantForPath('/millinery').tenantId).toBe('yammaman-brand');
  });

  it('declares exactly one primary surface', () => {
    expect(TENANTS.filter((t) => t.parentTenantId === null)).toHaveLength(1);
  });
});

describe('pagePathWithinTenant', () => {
  it('is a no-op for the brand surface, which owns the root', () => {
    const brand = getTenant('yammaman-brand');
    expect(pagePathWithinTenant(brand, '/collection')).toBe('/collection');
    expect(pagePathWithinTenant(brand, '/')).toBe('/');
  });

  it('strips the mill prefix', () => {
    const mill = getTenant('yammaman-textile-mill');
    expect(pagePathWithinTenant(mill, '/mill')).toBe('/');
    expect(pagePathWithinTenant(mill, '/mill/story')).toBe('/story');
  });
});

describe('getTenant', () => {
  it('fails loudly on an unknown tenant rather than returning undefined', () => {
    // An unknown tenant id is a configuration error. Returning undefined would
    // turn it into a cross-tenant read or a blank page; throwing names the bug.
    expect(() => getTenant('nope')).toThrow(/Unknown tenant/);
  });
});
