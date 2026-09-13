import { Container } from '../components/Container';
import { ASPECT_CLASS, Media } from '../components/Media';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Marquee — a full-bleed strip of tiles that loops continuously.
 *
 * WHY THIS EXISTS
 * The de-Framer reference leads with a horizontal strip of work rather than a
 * single hero image: it shows range in the first screen and costs no vertical
 * space. For a textile brand the equivalent is fabrications — the same garment
 * in eight cloths is the actual product argument.
 *
 * HOW THE LOOP IS SEAMLESS
 * This is the one thing that is easy to get subtly wrong. The strip renders the
 * item list TWICE and translates the track by exactly -50%. For that to land on
 * a seam rather than half a gap, the spacing between tiles must be part of each
 * tile (a trailing padding on the item) and NOT a `gap` on the flex container.
 * With a container gap, the missing half-gap at the wrap point drifts by a few
 * pixels every loop and reads as a stutter.
 *
 * ACCESSIBILITY
 * The second copy exists only to hide the seam, so it is `aria-hidden`: without
 * that a screen reader announces every image twice. Motion is CSS-only and the
 * base stylesheet neutralises animations under `prefers-reduced-motion`, which
 * leaves the strip parked on the first tile rather than empty.
 */
const SPEED_CLASS: Record<NonNullable<BlockOf<'marquee'>['props']['speed']>, string> = {
  slow: 'marquee-slow',
  normal: 'marquee-normal',
  fast: 'marquee-fast',
};

/**
 * Tile width. Named steps rather than arbitrary values, so the strip keeps a
 * consistent rhythm and the `sizes` hint below stays true to the layout.
 */
const TILE_CLASS = 'w-40 shrink-0 pr-4 md:w-64 lg:w-frame';
const TILE_SIZES = '(min-width: 1024px) 362px, (min-width: 768px) 256px, 160px';

/** The copy that hides the seam. Never the first one. */
const SEAM_COPIES = 2;

export function Marquee({ block }: { block: BlockOf<'marquee'> }) {
  const { label, items, aspect = '5/4', speed = 'normal' } = block.props;
  const labelId = `${block.id}-label`;

  const tiles = Array.from({ length: SEAM_COPIES }, (_, copy) =>
    items.map((item, index) => ({ item, copy, index })),
  ).flat();

  return (
    <Section labelledBy={label ? labelId : undefined}>
      {label ? (
        <Container>
          <div className="border-line flex items-baseline justify-between border-t pt-3">
            <p
              id={labelId}
              className="text-ink-secondary text-micro tracking-eyebrow uppercase"
            >
              {label}
            </p>
            <p className="text-ink-dimmed text-micro tracking-eyebrow uppercase">
              {items.length} pieces
            </p>
          </div>
        </Container>
      ) : null}

      {/*
        The strip is INSET by the page margin rather than full-bleed, so the
        marquee shares the page's edge with the header, the hero and everything
        else. It sits inside a Container for that reason — a padded
        `overflow-hidden` wrapper would NOT work, because CSS clips overflow at
        the PADDING box, so the tiles would still paint into the margin.

        `w-max` on the track keeps it at its natural width so the viewport never
        squeezes it; the Container is what clips it.
      */}
      <Container>
        {/* The strip reveals as ONE primitive, not per tile. The reference puts
            its appear markers on nav containers and titles, never on marquee
            tiles — and per-tile reveals would make frames fade in as they slide
            into view, which is a different effect entirely. */}
        <Reveal>
        <div className="overflow-hidden">
          <ul className={`marquee-track flex w-max list-none p-0 ${SPEED_CLASS[speed]}`}>
            {tiles.map(({ item, copy, index }) => (
              <li
                key={`${copy}-${index}`}
                className={TILE_CLASS}
                aria-hidden={copy > 0 ? true : undefined}
              >
                {/*
                  FRAME, then PAN. The frame owns the ratio and clips; the image
                  inside is 150% of the frame's width and drifts across it, in
                  the opposite direction to the strip.

                  `Media` is deliberately called WITHOUT an aspect: the frame
                  already sets the ratio, and letting Media set one too would
                  size the image from its own width (150% of the frame), making
                  it taller than the frame and defeating the crop.
                */}
                <div
                  className={`marquee-frame border-line rounded-md border ${
                    ASPECT_CLASS[aspect] ?? ''
                  }`}
                >
                  <div className="marquee-pan">
                    <Media
                      media={item}
                      sizes={TILE_SIZES}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        </Reveal>
      </Container>
    </Section>
  );
}
