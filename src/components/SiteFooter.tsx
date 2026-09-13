import { Container } from './Container';
import { CLIENT, type Tenant } from '../tenant/tenants';

/**
 * SiteFooter.
 *
 * The made-to-order note is not decoration: FR-4 makes deposit/balance and the
 * 3–4 month lead time the terms of sale, and a visitor who reaches checkout
 * without having seen them is a support ticket. Keeping it in the footer of
 * every page is the cheap version of that.
 */
export function SiteFooter({ tenant }: { tenant: Tenant }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-line bg-surface-sunken border-t">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-ink text-lg tracking-brand">
            {tenant.name}
          </p>
          <p className="text-ink-secondary mt-2 text-sm">
            {tenant.surface === 'mill'
              ? 'Aizu Momen, woven in Aizuwakamatsu.'
              : 'Made-to-order clothing, woven in Aizu.'}
          </p>
        </div>

        <div>
          <h2 className="text-ink text-xs tracking-wide uppercase">
            Made to order
          </h2>
          <p className="text-ink-secondary mt-2 text-sm">
            Made-to-order pieces take three to four months and are paid as a
            deposit with the balance due at completion.
          </p>
        </div>

        <div>
          <h2 className="text-ink text-xs tracking-wide uppercase">Enquiries</h2>
          <p className="text-ink-secondary mt-2 text-sm">
            Contact details to be confirmed with the client.
          </p>
        </div>
      </Container>

      <Container className="border-line text-ink-dimmed flex flex-wrap items-center justify-between gap-2 border-t py-6 text-xs">
        <p>
          © {year} {CLIENT.name}. All rights reserved.
        </p>
        <p>Platform by Muen Collective</p>
      </Container>
    </footer>
  );
}
