import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { Fold } from '../components/Fold';
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
 *
 * TWO TREATMENTS, chosen by content via `brandMark`:
 *
 *   brandMark: true  — the approved landing composition (hero.png): the LOGO on
 *                      the left and the tagline on the right, nothing else. No
 *                      eyebrow and no button: the mockup shows a clean two-element
 *                      band, and the nav above already carries the links.
 *   otherwise        — the text lockup, which is what an inner page (Shop, About,
 *                      Help) needs, since those pages have a real headline rather
 *                      than the brand.
 *
 * ACCESSIBILITY NOTE. When the heading is DRAWN rather than set, the heading
 * string still lives inside the <h1> as visually-hidden text. A logo is not an
 * accessible name substitute: without it the page would have an h1 that screen
 * readers announce as nothing.
 */
export function Hero({ block }: { block: BlockOf<'hero'> }) {
  const {
    eyebrow,
    heading,
    subheading,
    description,
    align = 'start',
    brandMark = false,
    image,
    cta,
  } = block.props;
  const headingId = `${block.id}-heading`;
  const centred = align === 'center';

  if (brandMark) {
    return (
      <Section labelledBy={headingId}>
        <Container>
          {/*
            Text LEFT, logo RIGHT. The swap is done with flex `order` rather than
            by moving the <h1> in the DOM: the heading stays FIRST in source
            order, so a screen reader still announces the brand name before the
            tagline, while the eye meets the tagline first. Reordering the markup
            instead would put an <h1> after body text for purely visual reasons.

            Mobile keeps the DOM order (logo, then text) — the order classes are
            md-only, so the stacked layout reads mark-first.
          */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            {/*
              Each side takes an EQUAL share (flex-1) and the mark is centred
              inside its own half, rather than the columns sitting at opposite
              edges. With `justify-between` the logo landed flush against the
              container's right edge and all the slack was trapped between the
              two columns; now the space around the mark is symmetric, which is
              what makes it read as centred rather than as pushed right.
            */}
            {/*
              NOT animated, at the client's direction: the mark is getting its own
              design, so it lands settled rather than sliding. Everything around
              it still takes the fold, which is what keeps it feeling like the
              still point of the section rather than an oversight.
            */}
            <div className="flex md:order-2 md:flex-1 md:justify-center">
              <h1 id={headingId} className="text-ink flex">
                <BrandMark className="w-56 sm:w-72 md:w-96" />
                <span className="sr-only">{heading}</span>
              </h1>
            </div>

            {subheading || description ? (
              <div className="md:order-1 md:max-w-lg md:flex-1">
                {/*
                  The tagline is a DISPLAY element, not body text: display face,
                  all caps, tight leading. It is the one thing on the page that
                  speaks at the logo's volume, which is why it uses the same
                  `display-lockup` treatment the wordmark does.
                */}
                {subheading ? (
                  <Fold delay={0.08}>
                    <p className="display-lockup text-ink text-5xl md:text-6xl">
                      {subheading}
                    </p>
                  </Fold>
                ) : null}


                {/*
                  The description sits UNDER the tagline, in the same column, so
                  the hero reads as one block of type beside the mark rather than
                  as two competing columns. It is right-aligned to follow the
                  tagline — the column has one alignment. Deliberately a step
                  SMALLER than body copy: it is support for the tagline, and at
                  body size it competed with it.
                */}
                {description?.length ? (
                  <Fold className="mt-5" delay={0.18}>
                    {description.map((paragraph, i) => (
                      <p
                        key={i}
                        className="text-ink-secondary text-micro mt-3 first:mt-0"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </Fold>
                ) : null}

                {/*
                  The ask, directly under the description with NO rule above it and
                  no horizontal padding: the label starts on the same left edge as
                  the tagline and the description, so the column reads as one block
                  of type rather than as type plus a detached button.
                */}
                {cta ? (
                  <Fold className="mt-6" delay={0.26}>
                    <Link
                      to={cta.href}
                      className="cta-wipe display-lockup inline-flex py-1 text-3xl md:text-4xl"
                    >
                      {cta.label}
                    </Link>
                  </Fold>
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
      </Section>
    );
  }

  const lockup = (
    <h1
      id={headingId}
      className="display-lockup text-ink text-4xl sm:text-6xl md:text-display"
    >
      {heading}
    </h1>
  );

  const ctaPill = cta ? (
    <Link
      to={cta.href}
      className="text-xs inline-flex h-7 items-center rounded-full px-6 tracking-wide uppercase no-underline transition-colors bg-ink text-ink-inverted hover:bg-accent"
    >
      {cta.label}
    </Link>
  ) : null;

  return (
    <Section labelledBy={headingId}>
      <Container>
        {centred ? (
          <div className="measure mx-auto text-center">
            {eyebrow ? (
              <p className="text-ink-secondary text-micro tracking-eyebrow uppercase">
                {eyebrow}
              </p>
            ) : null}
            {lockup}
            {subheading ? (
              <p className="text-ink text-body md:text-heading mt-4 font-semibold">
                {subheading}
              </p>
            ) : null}
            {ctaPill ? <p className="mt-8">{ctaPill}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-ink-secondary text-micro tracking-eyebrow uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <div className={eyebrow ? 'mt-2' : ''}>{lockup}</div>
            </div>

            {subheading || cta ? (
              <div className="md:max-w-xs md:pb-2 md:text-right">
                {subheading ? (
                  <p className="text-ink text-body md:text-heading font-semibold">
                    {subheading}
                  </p>
                ) : null}
                {ctaPill ? <p className="mt-4">{ctaPill}</p> : null}
              </div>
            ) : null}
          </div>
        )}

        {image ? (
          <Media
            media={image}
            className="border-line mt-12 w-full border"
            sizes="(min-width: 1152px) 1152px, 100vw"
            priority
          />
        ) : null}
      </Container>
    </Section>
  );
}
