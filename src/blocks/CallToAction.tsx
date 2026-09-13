import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * CallToAction — a closing prompt, optionally on the inverted band.
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
    <Section labelledBy={headingId} tone={inverted ? 'inverted' : 'base'}>
      <Container>
        <div className="measure">
          <h2
            id={headingId}
            className="font-display text-2xl md:text-3xl"
          >
            {heading}
          </h2>

          {body ? (
            <p
              className={`mt-4 ${inverted ? '' : 'text-ink-secondary'}`}
            >
              {body}
            </p>
          ) : null}

          <p className="mt-8">
            <Link
              to={cta.href}
              className={
                inverted
                  ? 'border-ink-inverted text-ink-inverted hover:bg-hover inline-block rounded-md border px-6 py-3 text-sm tracking-wide no-underline uppercase transition-colors'
                  : 'bg-brand text-ink-inverted hover:opacity-90 inline-block rounded-md px-6 py-3 text-sm tracking-wide no-underline uppercase transition-opacity'
              }
            >
              {cta.label}
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  );
}
