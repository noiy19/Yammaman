import { NavLink } from 'react-router-dom';
import { Container } from './Container';
import { MobileNav } from './MobileNav';
import { Reveal } from './Reveal';
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
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4">
        <nav aria-label="Primary">
          <ul className="hidden items-center gap-2 p-0 md:flex">
            {nav.map((page, i) => (
              <li key={page.pageId}>
                <Reveal delay={Math.min(i * 0.09, 0.6)}>
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
                </Reveal>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          NO UTILITY CONTROLS IN THE HEADER, per the redesign: the header is the
          nav and nothing else, which is what the mockup shows. Removed at the
          client's direction:
            - the HARAPPA link (the only route to the /mill surface)
            - the DARK/LIGHT theme toggle (the only theme switch)
          Both remain reachable in the mobile menu panel, which is a menu rather
          than the header row. On desktop neither is currently reachable — see
          docs/backlog.md; the footer is the obvious home if they are wanted back.
        */}
        <MobileNav
          pages={nav}
          tenantName={tenant.name}
          sibling={sibling ? { name: sibling.name, basePath: sibling.basePath } : undefined}
        />
      </Container>
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
