import { Container } from '../components/Container';
import { Fold } from '../components/Fold';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * SectionHeading — the section opener, and nothing else.
 *
 * Deliberately a block of its own rather than a `heading` prop on every other
 * block: sections get added, reordered and emptied independently, and a heading
 * that belongs to the block below it cannot survive that.
 *
 * It exists because a section is arriving whose design is not settled yet. The
 * opener lands now, in the display face, so the page has its structure and the
 * content can be filled in without touching a component.
 *
 * The heading is the block's h2, never an h1 — the hero owns h1 on every page
 * (enforced by scripts/validate-content.mjs), so the document outline stays
 * valid whether or not a section heading is present.
 */
export function SectionHeading({ block }: { block: BlockOf<'sectionHeading'> }) {
  const { eyebrow, heading, intro } = block.props;
  const headingId = `${block.id}-heading`;

  return (
    <Section labelledBy={headingId}>
      {/*
        The doubled rule sits above the heading, so every section OPENS with the
        same separator. It lives here rather than on the block before it because a
        section should carry its own edge: reorder the page and the rule follows
        the heading instead of being left behind at the bottom of whatever used to
        precede it.
      */}
      <Container>
        {/*
          Fold INSIDE the Container, so the rule it renders is measured by the
          content column. Outside the Container the rule spans the whole viewport
          — 1440px against the column's 1292 — which reads as a page-wide rule
          rather than as a section edge.
        */}
        <Fold rule>
        {eyebrow ? (
          <p className="text-ink-secondary text-micro tracking-eyebrow uppercase">
            {eyebrow}
          </p>
        ) : null}

        {/*
          The display face, all caps and tight — the same `display-lockup`
          treatment as the tagline and the mark, so a section opener reads as
          part of the same voice rather than as another headline style.
          `text-balance` keeps a two-word heading from breaking one word per line
          at tablet widths.
        */}
        <h2
          id={headingId}
          className={`display-lockup text-ink text-5xl md:text-7xl text-balance ${eyebrow ? 'mt-3' : ''}`}
        >
          {heading}
        </h2>

        {intro ? <p className="text-ink-secondary text-body mt-4 max-w-measure">{intro}</p> : null}
        </Fold>
      </Container>
    </Section>
  );
}
