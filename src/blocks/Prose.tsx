import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Prose — running text.
 *
 * `body` is an array of paragraphs, not a markdown/HTML string. FR-1 wants
 * content the client can edit without breaking the page; a rich-text blob is
 * how you get an unclosed tag in production. Structure that matters gets its own
 * block type.
 *
 * The `measure` utility caps line length. Long lines are the single most common
 * readability defect on editorial sites and they are invisible to whoever wrote
 * the copy on a wide monitor.
 */
export function Prose({ block }: { block: BlockOf<'prose'> }) {
  const { heading, body, tone = 'body' } = block.props;
  const headingId = `${block.id}-heading`;

  return (
    <Section labelledBy={heading ? headingId : undefined} tone="base">
      <Container>
        <div className="measure">
          {heading ? (
            <h2
              id={headingId}
              className="font-display text-ink text-heading"
            >
              {heading}
            </h2>
          ) : null}

          <div className={heading ? 'mt-5' : ''}>
            {body.map((paragraph, i) => (
              <p
                key={i}
                className={
                  /*
                    Both tones are the reference's body step (16px). It has no
                    "lead" size — its intro paragraph is the same 16px as its
                    body copy — so the lead is distinguished by contrast rather
                    than by being larger, which is what keeps a paragraph from
                    competing with the display type above it.
                  */
                  tone === 'lead'
                    ? 'text-ink text-body mt-4 first:mt-0'
                    : 'text-ink-secondary text-body mt-4 first:mt-0'
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
