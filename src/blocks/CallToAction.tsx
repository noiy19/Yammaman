import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * CallToAction — the closing prompt, and the page's second and last loud moment.
 *
 * The de-Framer reference ends on a display wordmark set at 200px with the
 * links on a single small line beneath it. That ratio is the point: the closing
 * statement is typographic, and the actual choices are made small and quiet
 * underneath it. Reproducing it here means the CTA heading is the only large
 * type below the hero — which is also why the heading is heading-level 2 but
 * renders an order of magnitude larger than every other h2 on the page. Level
 * is structure; size is design.
 *
 * The inverted tone is the ONE dark band on an otherwise light page; when it
 * appears, the link inside it must invert too. That is why the tone drives both
 * the Section and the button classes from one prop rather than being two
 * independent styling decisions that can disagree.
 */
export function CallToAction({ block }: { block: BlockOf<'callToAction'> }) {
  const { heading, body, cta, tone = 'neutral' } = block.props;
  const headingId = `${block.id}-heading`;
  const inverted = tone === 'inverted';

  return (
    <Section
      labelledBy={headingId}
      tone={inverted ? 'inverted' : 'base'}
      space="large"
    >
      <Container>
        <h2
          id={headingId}
          className="display-lockup text-4xl sm:text-6xl md:text-display"
        >
          {heading}
        </h2>

        {body ? (
          <p className={`measure mt-6 ${inverted ? '' : 'text-ink-secondary'}`}>
            {body}
          </p>
        ) : null}

        <p className="mt-8">
          <Link
            to={cta.href}
            className={
              inverted
                ? 'border-ink-inverted text-ink-inverted hover:bg-hover inline-block rounded-full border px-7 py-3 text-micro tracking-wide no-underline uppercase transition-colors'
                : 'bg-ink text-ink-inverted hover:bg-accent inline-block rounded-full px-7 py-3 text-micro tracking-wide no-underline uppercase transition-colors'
            }
          >
            {cta.label}
          </Link>
        </p>
      </Container>
    </Section>
  );
}
