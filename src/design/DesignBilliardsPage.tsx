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
          it turns back to black.
        </p>
        <p className="text-ink-secondary measure mt-2 text-micro">
          The letter you point at does not move — the turn is a pulse that pushes
          its neighbours instead, and they knock into the ones beyond them. So the
          ball you are aiming at stays where it is and can be aimed at twice,
          which is what makes the toggle possible. A letter only ever moves
          because another one hit it.
        </p>
        <p className="text-ink-secondary measure mt-2 text-micro">
          Movement is vertical only. Every letter keeps its column, so the mark's
          horizontal rhythm survives and the wordmark stays readable while it
          moves; travel is capped at just over five per cent of the table's height,
          which is enough to see and not enough to lose the letters. Leave the set
          alone for five seconds and it travels home.
        </p>
        <p className="text-ink-secondary measure mt-2 text-micro">
          Worth knowing: on this paper ground a white letter reads as an{' '}
          <em>outline</em> — the fill matches the page, so the hairline is doing
          all the work. Over a photograph or a dark band it would read as white.
        </p>
        <p className="text-ink-secondary measure mt-2 text-micro">
          Eight letters, eight balls, one table. The letters are the real wordmark
          shapes, extracted from the source artwork, so their positions here are
          the mark's own composition rather than a layout invented for the demo.
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
