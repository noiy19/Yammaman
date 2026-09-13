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
              className="font-display text-ink text-2xl md:text-3xl"
            >
              {heading}
            </h2>
          ) : null}

          <div className={heading ? 'mt-5' : ''}>
            {body.map((paragraph, i) => (
              <p
                key={i}
                className={
                  tone === 'lead'
                    ? 'text-ink-secondary mt-4 text-lg first:mt-0 md:text-xl'
                    : 'text-ink-secondary mt-4 first:mt-0'
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
