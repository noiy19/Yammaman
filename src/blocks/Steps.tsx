import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Steps — an ordered sequence.
 *
 * Rendered as <ol> because the order carries meaning: step 2 of making a
 * made-to-order garment is not interchangeable with step 4. A <ul> of cards
 * would look identical and tell a screen reader nothing.
 */
export function Steps({ block }: { block: BlockOf<'steps'> }) {
  const { heading, intro, steps } = block.props;
  const headingId = `${block.id}-heading`;

  return (
    <Section labelledBy={heading ? headingId : undefined} tone="raised">
      <Container>
        {heading ? (
          <h2 id={headingId} className="font-display text-ink text-2xl md:text-3xl">
            {heading}
          </h2>
        ) : null}

        {intro ? (
          <p className="text-ink-secondary measure mt-4">{intro}</p>
        ) : null}

        <ol className="mt-10 grid list-none gap-8 p-0 md:grid-cols-2">
          {steps.map((step, i) => (
            <li key={i} className="border-line border-t pt-5">
              <h3 className="text-ink text-base font-medium">{step.title}</h3>
              <p className="text-ink-secondary mt-2 text-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
