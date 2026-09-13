import { Link } from 'react-router-dom';
import { Container } from './Container';
import { Fold } from './Fold';
import { CLIENT, type Tenant } from '../tenant/tenants';
import type { PageDoc } from '../content/types';

/**
 * SiteFooter.
 *
 * Redesigned as an editorial close rather than a sitemap: the brand set large in
 * the display face, the links in columns beside it, and the legal line under a
 * hairline. The doubled rule at the top is the same separator that opens a
 * section, so the footer reads as the last section of the page rather than as a
 * different kind of thing bolted on.
 *
 * THE TERMS ARE NOT DECORATION. FR-4 makes deposit/balance and the 3–4 month lead
 * time the terms of sale, and a visitor who reaches checkout without having seen
 * them is a support ticket. Keeping them in the footer of every page is the cheap
 * version of that — so they stay, and they get their own row rather than a narrow
 * column, because small print is how terms get missed.
 *
 * The nav is derived from the tenant's pages and its `navOrder`, the same way the
 * header does it, so the two cannot disagree about what the site contains.
 */
export function SiteFooter({
  tenant,
  pages = [],
}: {
  tenant: Tenant;
  pages?: PageDoc[];
}) {
  const year = new Date().getFullYear();

  const nav = pages
    .filter((p) => p.tenantId === tenant.tenantId)
    .sort((a, b) => navRank(tenant, a.path) - navRank(tenant, b.path));

  const descriptor =
    tenant.surface === 'mill'
      ? 'Aizu Momen, woven in Aizuwakamatsu.'
      : 'Made-to-order clothing, woven in Aizu.';

  const elsewhere = [...(tenant.externalLinks ?? []), ...(tenant.socialLinks ?? [])];

  return (
    <footer className="bg-surface">
      <Container>
        <Fold rule>
          <div className="grid gap-x-8 gap-y-10 py-12 md:grid-cols-12">
            {/*
              The brand at display size, set as TYPE rather than as the mark: the
              wordmark is still being designed, and a footer shipping a
              placeholder logo would be the first thing to be wrong.
            */}
            <div className="md:col-span-5">
              <p className="display-lockup text-ink text-4xl md:text-5xl">
                {tenant.name}
              </p>
              <p className="text-ink-secondary measure mt-4 text-micro">
                {descriptor}
              </p>
            </div>

            {nav.length ? (
              <nav aria-label="Footer" className="md:col-span-2">
                <h2 className="text-ink text-2xs tracking-wide uppercase">Shop</h2>
                <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                  {nav.map((page) => (
                    <li key={page.pageId}>
                      <Link
                        to={page.path}
                        className="text-ink-secondary hover:text-ink text-micro no-underline hover:underline"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            {elsewhere.length ? (
              <div className="md:col-span-3">
                <h2 className="text-ink text-2xs tracking-wide uppercase">
                  Elsewhere
                </h2>
                <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                  {elsewhere.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-secondary hover:text-ink text-micro no-underline hover:underline"
                      >
                        {link.label}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <h2 className="text-ink text-2xs tracking-wide uppercase">
                Enquiries
              </h2>
              <p className="text-ink-secondary mt-3 text-micro">
                Contact details to be confirmed with the client.
              </p>
            </div>

            <div className="md:col-span-12">
              <h2 className="text-ink text-2xs tracking-wide uppercase">
                Made to order
              </h2>
              <p className="text-ink-secondary measure mt-3 text-micro">
                Made-to-order pieces take three to four months and are paid as a
                deposit with the balance due at completion.
              </p>
            </div>
          </div>

          <div className="border-line text-ink-dimmed flex flex-wrap items-center justify-between gap-2 border-t py-6 text-micro">
            <p>
              © {year} {CLIENT.name}. All rights reserved.
            </p>
            <p>Platform by Muen Collective</p>
          </div>
        </Fold>
      </Container>
    </footer>
  );
}

/** Position of a page in the nav — mirrors the header so the two cannot diverge. */
function navRank(tenant: Tenant, path: string): number {
  const order = tenant.navOrder ?? [];
  const index = order.indexOf(path);
  return index === -1 ? order.length : index;
}
