import { Container } from '../components/Container';
import { Fold } from '../components/Fold';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Faq — a native <details> list, laid out as numbered rows.
 *
 * Native disclosure, not a JS accordion. It is keyboard-operable, it is announced
 * correctly, it works before hydration, and it prints open. An accordion built
 * from divs and click handlers is the classic way to lose all four at once.
 *
 * THE LAYOUT is a three-column grid: index, then the question right-aligned into
 * the middle, then the marker. A grid rather than nested flex because the ANSWER
 * has to line up with the QUESTION — both sit in the middle column, so they share
 * an edge by construction instead of by matching padding values that drift apart
 * the moment either changes.
 *
 * THE MARKER is a plus built from two bars rather than a glyph. When the row
 * opens the vertical bar scales to nothing, so the plus becomes a minus: one
 * element that is correct in both states, instead of swapping characters and
 * hoping the two glyphs are optically the same size. It is aria-hidden because
 * <details> already reports expanded/collapsed — an icon that also announced
 * itself would say it twice.
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
            <Fold key={i} delay={Math.min(i * 0.06, 0.4)}>
            <details className="group border-line border-t last:border-b">
              <summary className="grid-row-marker cursor-pointer list-none items-baseline gap-x-6 py-5 [&::-webkit-details-marker]:hidden">
                <span className="text-ink-secondary group-hover:text-ink group-open:text-ink text-lg tabular-nums transition-colors">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <span className="text-ink text-heading text-right font-semibold text-balance">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="text-ink-secondary group-hover:text-ink relative block h-3 w-3 shrink-0 self-center transition-colors"
                >
                  <span className="bg-current absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" />
                  <span className="bg-current absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>

              {/*
                The same grid, so the answer shares the question's right edge — and
                the third cell is w-3 to MATCH THE ICON's width. Left empty it
                measured 0px, which made this row's middle column 12px wider and
                put the answer 12px right of the question it belongs to.
              */}
              <div className="grid-row-marker gap-x-6">
                <span aria-hidden="true" />
                <p className="text-ink-secondary measure mr-0 ml-auto pb-6 text-right text-body">
                  {item.answer}
                </p>
                <span aria-hidden="true" className="w-3" />
              </div>
            </details>
            </Fold>
          ))}
        </div>
      </Container>
    </Section>
  );
}
