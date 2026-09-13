import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Faq — a native <details> list.
 *
 * Native disclosure, not a JS accordion. It is keyboard-operable, it is
 * announced correctly, it works before hydration, and it prints open. An
 * accordion built from divs and click handlers is the classic way to lose all
 * four of those at once.
 *
 * NOTE FOR THE REVIEW FLOW (PRD FR-5): this same content is the preset script
 * the FAQ-first chat answers from before escalating. Editing an answer here
 * changes what the AI worker says, so it is client-owned content with a
 * behavioural effect — worth flagging in review rather than treating as copy.
 */
export function Faq({ block }: { block: BlockOf<'faq'> }) {
  const { heading, intro, items } = block.props;
  const headingId = `${block.id}-heading`;

  return (
    <Section labelledBy={heading ? headingId : undefined}>
      <Container>
        {heading ? (
          <h2 id={headingId} className="font-display text-ink text-2xl md:text-3xl">
            {heading}
          </h2>
        ) : null}
        {intro ? <p className="text-ink-secondary measure mt-4">{intro}</p> : null}

        <div className="measure mt-10">
          {items.map((item, i) => (
            <details key={i} className="border-line border-b py-4">
              <summary className="text-ink cursor-pointer text-base font-medium">
                {item.question}
              </summary>
              <p className="text-ink-secondary mt-3 text-sm">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
