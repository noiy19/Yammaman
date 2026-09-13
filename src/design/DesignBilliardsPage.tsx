import { Link } from 'react-router-dom';
import { BilliardsWordmark } from './BilliardsWordmark';

/**
 * A design page, deliberately NOT a content page.
 *
 * Routes on this site are content — a page exists because a JSON document claims
 * its path. A prototype is the opposite: it is not something Noi authors, it is
 * something she is deciding about. So it lives behind its own branch in App.tsx
 * and never appears in the nav or the sitemap.
 *
 * The point of it existing separately is that the landing page can stay still
 * while an idea is argued about. When the idea is settled, the component moves
 * into the hero and this route goes away.
 */
export function DesignBilliardsPage() {
  return (
    <main className="bg-surface page-gutter min-h-screen">
      <div className="mx-auto w-full max-w-page py-12">
        <p className="text-ink-secondary text-2xs tracking-wide uppercase">
          Design prototype · not part of the site
        </p>
        <h1 className="font-display text-ink mt-3 text-heading">Billiards wordmark</h1>

        <p className="text-ink-secondary measure mt-4 text-micro">
          Point at a letter: it turns a full 360° on its own axis and arrives
          white with a hairline drawn inside the letterform. Point at it again and
          it turns back to black. As it turns, it lifts slightly and settles back
          where it was.
        </p>
        <p className="text-ink-secondary measure mt-2 text-micro">
          Only the letter you point at moves. An earlier version was a real table —
          the turn pushed its neighbours, they knocked into the ones beyond, and
          the whole wordmark came apart and reassembled. Too much: a wordmark that
          scrambles is a wordmark nobody reads. What is left is the part that reads
          as motion rather than as damage.
        </p>

        <div className="mt-12">
          <BilliardsWordmark />
        </div>

        <p className="text-ink-dimmed measure mt-12 text-micro">
          Reference: <Link to="/" className="text-accent hover:underline">the landing page</Link> —
          the wordmark there is a single static SVG and stays that way until this is
          decided.
        </p>
      </div>
    </main>
  );
}
