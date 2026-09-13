import { useEffect } from 'react';
import { Container } from '../components/Container';
import { BlockRenderer } from '../components/BlockRenderer';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { listPages } from '../content/loadContent';
import type { PageDoc } from '../content/types';
import type { Tenant } from '../tenant/tenants';

/**
 * ContentPage — every route renders through here.
 *
 * There is no per-page React component and no route table. A page is a JSON
 * document; this is the one thing that knows how to render one. That is what
 * "content-as-data" buys: the client adds /faq-2.json and the page exists,
 * appears in the nav, and passes the same gates as everything else.
 */
export function ContentPage({
  tenant,
  page,
}: {
  tenant: Tenant;
  page: PageDoc;
}) {
  const pages = listPages(tenant);

  useEffect(() => {
    document.title = page.seo?.title ?? `${page.title} — ${tenant.name}`;

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = page.seo?.description ?? '';
  }, [page, tenant]);

  return (
    <div className="bg-surface flex min-h-dvh flex-col">
      <SiteHeader tenant={tenant} pages={pages} />
      <main id="main" className="flex-1">
        <BlockRenderer blocks={page.blocks} />
      </main>
      <SiteFooter tenant={tenant} />
    </div>
  );
}

/**
 * NotFound — reached when a path resolves to a tenant but no page owns it.
 *
 * It still renders the tenant's chrome, because "this page does not exist"
 * should not also mean "this site does not exist".
 */
export function NotFound({ tenant }: { tenant: Tenant }) {
  const pages = listPages(tenant);
  const home = pages.find((p) => p.path === tenant.basePath) ?? pages[0];

  useEffect(() => {
    document.title = `Not found — ${tenant.name}`;
  }, [tenant]);

  return (
    <div className="bg-surface flex min-h-dvh flex-col">
      <SiteHeader tenant={tenant} pages={pages} />
      <main id="main" className="flex-1">
        <Container className="py-24">
          <h1 className="font-display text-ink text-4xl">Page not found</h1>
          <p className="text-ink-secondary mt-4">
            There is no page at this address on {tenant.name}.
          </p>
          {home ? (
            <p className="mt-6">
              <a href={home.path} className="text-accent">
                Go to {home.title}
              </a>
            </p>
          ) : null}
        </Container>
      </main>
      <SiteFooter tenant={tenant} />
    </div>
  );
}
