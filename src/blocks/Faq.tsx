import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Faq — a native <details> list, laid out as numbered rows.
 *
 * Native disclosure, not a JS accordion. It is keyboard-operable, it is announced
 * correctly, it works before hydration, and it prints open. An accordion built
 * from divs and click handlers is the classic way to lose all four at once.
 *
 * THE LAYOUT is a numbered row: the index on the left, the question right-aligned
 * into a second column, the answer revealing beneath it. That two-column split is
 * why the question can be set large — there is a whole empty column beside the
 * number for it to occupy, so it does not have to be small to avoid a long line.
 *
 * THE AFFORDANCE PROBLEM, and what was done about it. The reference layout this
 * borrows from is a static list: no borders, no markers, nothing that says
 * "clickable". Borrowing its look for something that opens leaves the interaction
 * invisible. So each row carries a hairline and the whole row is a cursor-pointer
 * target, and the NUMBER darkens on hover and while open — the number is already
 * there, so using it as the indicator costs no new element and keeps the right
 * column clean. Screen readers get the real state from <details> regardless.
 *
 * NOTE FOR THE REVIEW FLOW (PRD FR-5): this same content is the preset script the
 * FAQ-first chat answers from before escalating. Editing an answer here changes
 * what the AI worker says, so it is client-owned content with a behavioural
 * effect — worth flagging in review rather than treating as copy.
 */
export function Faq({ block }: { block: BlockOf<'faq'> }) {
  const { heading, intro, items } = block.props;
  const headingId = `${block.id}-heading`;

  return (
    <Section labelledBy={heading ? headingId : undefined}>
      <Container>
        {heading ? (
          <h2 id={headingId} className="font-display text-ink text-heading">
            {heading}
          </h2>
        ) : null}
        {intro ? <p className="text-ink-secondary measure mt-4">{intro}</p> : null}

        <div className="mt-10">
          {items.map((item, i) => (
            <details key={i} className="group border-line border-t last:border-b">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <span className="text-ink-secondary group-hover:text-ink group-open:text-ink shrink-0 text-lg tabular-nums transition-colors">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span className="text-ink text-heading text-right font-semibold text-balance">
                  {item.question}
                </span>
              </summary>

              {/*
                The answer sits in the SAME column as the question, not under the
                number: it belongs to the question, and starting it at the left
                margin would read as a new row rather than as that row opening.
              */}
              <p className="text-ink-secondary measure mr-0 ml-auto pb-6 text-right text-body">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
