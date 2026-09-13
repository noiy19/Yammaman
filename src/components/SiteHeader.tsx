import { Link, NavLink } from 'react-router-dom';
import { Container } from './Container';
import { ThemeToggle } from './ThemeToggle';
import type { PageDoc } from '../content/types';
import { TENANTS, type Tenant } from '../tenant/tenants';

/**
 * SiteHeader — nav derived from content, not from a hard-coded menu.
 *
 * The nav is the tenant's pages, in path order. That means a new page appears in
 * the nav by existing, which is the same principle as the rest of the site: the
 * client adds content, not code. A hand-maintained menu array would be a second
 * list of pages that can disagree with the first.
 */
export function SiteHeader({
  tenant,
  pages,
}: {
  tenant: Tenant;
  pages: PageDoc[];
}) {
  const nav = pages.filter((p) => p.tenantId === tenant.tenantId);
  const sibling = TENANTS.find((t) => t.tenantId !== tenant.tenantId);

  return (
    <header className="border-line bg-surface sticky top-0 z-10 border-b backdrop-blur">
      <Container className="flex items-center justify-between gap-6 py-4">
        <Link
          to={tenant.basePath}
          className="font-display text-ink tracking-brand text-xl no-underline"
        >
          {tenant.name}
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {nav.map((page) => (
              <li key={page.pageId}>
                <NavLink
                  to={page.path}
                  end={page.path === '/'}
                  className={({ isActive }) =>
                    `text-sm no-underline transition-colors ${
                      isActive
                        ? 'text-ink font-medium'
                        : 'text-ink-secondary hover:text-ink'
                    }`
                  }
                >
                  {page.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {sibling ? (
            <Link
              to={sibling.basePath}
              className="text-ink-secondary hover:text-ink hidden text-xs tracking-wide uppercase no-underline sm:inline"
            >
              {sibling.name}
            </Link>
          ) : null}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
