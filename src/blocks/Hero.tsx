import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { Media } from '../components/Media';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Hero — always the page's <h1>.
 *
 * Heading LEVEL is structural, not visual. Every page starts with a hero
 * (enforced by scripts/validate-content.mjs), so the hero owns h1 and every
 * other block owns h2. That is what makes the document outline valid without
 * anyone having to remember a rule per page.
 */
export function Hero({ block }: { block: BlockOf<'hero'> }) {
  const { eyebrow, heading, subheading, align = 'start', image, cta } = block.props;
  const headingId = `${block.id}-heading`;
  const centred = align === 'center';

  return (
    <Section labelledBy={headingId} className={centred ? 'text-center' : ''}>
      <Container>
        <div className={centred ? 'mx-auto measure' : ''}>
          {eyebrow ? (
            <p className="text-ink-secondary text-xs tracking-eyebrow uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h1
            id={headingId}
            className="font-display text-ink mt-3 text-4xl leading-display md:text-6xl"
          >
            {heading}
          </h1>

          {subheading ? (
            <p className="text-ink-secondary mt-5 text-lg md:text-xl">
              {subheading}
            </p>
          ) : null}

          {cta ? (
            <p className="mt-8">
              <Link
                to={cta.href}
                className="bg-brand text-ink-inverted hover:opacity-90 inline-block rounded-md px-6 py-3 text-sm tracking-wide no-underline uppercase transition-opacity"
              >
                {cta.label}
              </Link>
            </p>
          ) : null}
        </div>

        {image ? (
          <Media
            media={image}
            className="border-line mt-12 w-full rounded-lg border"
            sizes="(min-width: 1152px) 1152px, 100vw"
            // The hero is the largest-contentful-paint candidate on most pages,
            // so it is the one image worth loading eagerly and at high priority.
            priority
          />
        ) : null}
      </Container>
    </Section>
  );
}
