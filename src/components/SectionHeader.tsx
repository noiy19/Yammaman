import { Link } from 'react-router-dom';
import type { Link as LinkDoc } from '../content/types';

/**
 * SectionHeader — the editorial section label, taken from the de-Framer
 * reference.
 *
 * Every section in the reference opens the same way: a small label on the left,
 * a meta line in the middle, a link on the right, all sitting on a hairline
 * rule. Repeating that is what makes a page of otherwise unrelated blocks read
 * as one document — and it matters more here than in a hand-built page, because
 * the client may reorder these blocks. The only thing guaranteeing a coherent
 * page is that each section introduces itself identically.
 *
 * THE LABEL IS DELIBERATELY SMALL. In the reference the display face is the only
 * large type on the page (260px); section labels measure 14–16px. Sizing a
 * section heading up "because it is an h2" is the reflex this component exists
 * to prevent — heading LEVEL is document structure and stays h2 whatever size
 * it renders at.
 */
export function SectionHeader({
  id,
  label,
  meta,
  link,
}: {
  id?: string;
  label: string;
  /** Right-aligned context: a count, a year, a place. */
  meta?: string;
  link?: LinkDoc;
}) {
  return (
    <div className="border-line-strong flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t pt-3">
      <h2
        id={id}
        className="text-ink text-micro font-semibold tracking-eyebrow uppercase"
      >
        {label}
      </h2>

      {meta ? <p className="text-ink-secondary text-micro">{meta}</p> : null}

      {link ? (
        <Link
          to={link.href}
          className="text-ink hover:text-accent text-micro underline-offset-4 hover:underline"
        >
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
