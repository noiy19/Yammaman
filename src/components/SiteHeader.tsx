import { Link, NavLink } from 'react-router-dom';
import { Container } from './Container';
import { Fold } from './Fold';
import { MobileNav } from './MobileNav';
import type { PageDoc } from '../content/types';
import { TENANTS, type Tenant } from '../tenant/tenants';

/**
 * SiteHeader — NAV ONLY.
 *
 * Per the approved redesign (hero.png): the header carries the navigation and
 * nothing else. The wordmark is NOT here — it is the hero's job, at display size,
 * paired with the tagline. That is what the mockup shows: pills top-left, logo
 * and tagline in the hero below.
 *
 * Geometry ported from the reference where it still applies: nav labels are 12px
 * in a 27–28px pill with a hairline border at full radius, and the row is the
 * first thing on the page (the reference's header band starts at y=16).
 *
 * The nav is content-derived — it lists the tenant's pages, ordered by
 * `navOrder` in tenants/tenants.json, because path order cannot express
 * Home, Shop, About, Help.
 */
export function SiteHeader({
  tenant,
  pages,
}: {
  tenant: Tenant;
  pages: PageDoc[];
}) {
  const nav = pages
    .filter((p) => p.tenantId === tenant.tenantId)
    .sort((a, b) => navRank(tenant, a.path) - navRank(tenant, b.path));
  const sibling = TENANTS.find((t) => t.tenantId !== tenant.tenantId);

  return (
    <header className="bg-surface">
      {/*
        The header takes the fold entrance too. It is above the trigger band, so
        it relies on Fold's in-viewport-at-mount fallback — without that it would
        be pushed a full height down inside the clip and simply not exist.
      */}
      <Fold once>
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4">
          <nav aria-label="Primary">
            <ul className="hidden items-center gap-2 p-0 md:flex">
              {nav.map((page) => (
                // `flex items-center` on the li, not just on the ul. The li inherits
                // the row's 24px line-height, so an inline child sits on the BASELINE
                // inside a taller line box and lands ~2px below centre. Making the li
                // a flex box makes its child a flex item, which centres properly.
                <li key={page.pageId} className="flex items-center">
                  <NavLink
                    to={page.path}
                    end={page.path === '/'}
                    className={({ isActive }) =>
                      `text-xs inline-flex h-5 items-center rounded-full border px-4 no-underline transition-colors ${
                        isActive
                          ? 'border-line-strong text-ink font-medium'
                          : 'border-line text-ink-secondary hover:text-ink hover:bg-hover'
                      }`
                    }
                  >
                    {page.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            The client's other properties, then the account entry point. Both come
            from tenant config rather than content, because they are properties of
            the SURFACE, not of any page: they must not change when a page is
            edited, reordered or deleted.

            `rel="noreferrer"` because these leave the site, and the arrow is
            marked aria-hidden so a screen reader announces "yamma.jp" rather
            than "yamma.jp north east arrow".
          */}
          <div className="ml-auto flex items-center gap-4 md:gap-6">
            {tenant.externalLinks?.length ? (
              <ul className="hidden items-center gap-4 p-0 md:flex">
                {tenant.externalLinks.map((link) => (
                  <li key={link.href} className="flex items-center">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline text-2xs tracking-wide uppercase no-underline"
                    >
                      {link.label}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {tenant.signIn ? (
              <Link
                to={tenant.signIn.href}
                className="text-accent hover:underline font-display text-lg tracking-wide uppercase no-underline hidden sm:inline"
              >
                {tenant.signIn.label}
              </Link>
            ) : null}

            {/*
              The header's commercial ask, on every page. Filled rather than
              outlined so it outranks the nav pills and the utility links without
              having to be larger — the only filled control in the row.
            */}
            {tenant.headerCta ? (
              <Link
                to={tenant.headerCta.href}
                className="text-xs bg-ink text-ink-inverted hover:bg-accent inline-flex h-5 items-center rounded-full px-4 no-underline transition-colors"
              >
                {tenant.headerCta.label}
              </Link>
            ) : null}

            <MobileNav
              pages={nav}
              tenantName={tenant.name}
              sibling={sibling ? { name: sibling.name, basePath: sibling.basePath } : undefined}
            />
          </div>
        </Container>
      </Fold>
    </header>
  );
}

/**
 * Position of a page in the nav. Unlisted pages rank after every listed one and
 * keep their relative path order, because Array.sort is stable.
 */
function navRank(tenant: Tenant, path: string): number {
  const order = tenant.navOrder ?? [];
  const index = order.indexOf(path);
  return index === -1 ? order.length : index;
}
