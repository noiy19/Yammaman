import { Container } from '../components/Container';
import { Media } from '../components/Media';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Figure — one image with an optional caption.
 *
 * Captions use <figcaption> so the association is programmatic rather than
 * visual. An image whose caption is a sibling div is a caption only for people
 * who can see it.
 */
export function Figure({ block }: { block: BlockOf<'figure'> }) {
  const { image, caption } = block.props;

  return (
    <Section>
      <Container>
        <figure className="m-0">
          {/*
            A white MAT rather than a border. The reference frames its images in
            white, and a mat is the honest way to build it: padding on a white
            ground gives the same result as a thick border but keeps the image's
            own box clean, so nothing has to be subtracted from its width.
          */}
          <div className="bg-frame p-1.5">
            <Media
              media={image}
              className="w-full"
              // The figure spans the container, so tell the browser the real
              // layout width instead of letting it assume 100vw and download the
              // largest candidate on every screen.
              sizes="(min-width: 1152px) 1152px, 100vw"
            />
          </div>
          {caption ? (
            <figcaption className="text-ink-dimmed measure mt-3 text-micro">
              {caption}
            </figcaption>
          ) : null}
          {image.credit ? (
            <p className="text-ink-dimmed mt-1 text-micro">Credit: {image.credit}</p>
          ) : null}
        </figure>
      </Container>
    </Section>
  );
}
