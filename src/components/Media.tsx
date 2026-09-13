import type { ImgHTMLAttributes } from 'react';
import type { Media as MediaDoc } from '../content/types';
import { resolveImage } from '../media/cloudinary';

/**
 * Aspect tokens, mirroring the `aspect` enum in content/schema/page.schema.json
 * and the `--aspect-*` values in src/styles/index.css. Content picks a ratio by
 * name; this is the one place that name becomes a class.
 */
export const ASPECT_CLASS: Record<string, string> = {
  '1/1': 'aspect-square',
  '4/5': 'aspect-portrait',
  '3/4': 'aspect-frame',
  '3/2': 'aspect-landscape',
  '16/9': 'aspect-wide',
  '5/4': 'aspect-tile',
};

/**
 * Media — the single way an image reaches the page.
 *
 * WHY A COMPONENT AND NOT AN <img> PER BLOCK
 * Every image needs the same four things, and a block that forgets one produces
 * a bug that is invisible in review and expensive in production:
 *
 *   - `alt`            — required by the schema, so it cannot be omitted
 *   - `loading`/`decoding` — a storefront is mostly images; eager-loading all of
 *                        them is the difference between a fast page and a slow one
 *   - `srcSet`/`sizes`  — a phone must not download a 2000px hero
 *   - `width`/`height`  — reserves layout space, so the page does not jump while
 *                        images load (CLS, a Core Web Vital)
 *
 * Centralising them means a block author cannot forget. It also means the
 * Cloudinary-vs-local branch exists once instead of in five blocks.
 */
export function Media({
  media,
  className = '',
  sizes,
  priority = false,
  aspect,
  imageProps,
}: {
  media: MediaDoc;
  /** Extra classes. `object-cover` is applied by default — see below. */
  className?: string;
  /** `sizes` for the responsive srcset. Pass when the layout width is known. */
  sizes?: string;
  /** Above-the-fold only. Sets eager loading + high fetch priority. */
  priority?: boolean;
  /**
   * Force a ratio, overriding the content's own `aspect`.
   *
   * For surfaces whose ratio is a layout decision rather than a per-image one —
   * fabric swatches are always square because the grid is square, and a content
   * author choosing otherwise would produce a ragged grid. Content keeps the
   * choice where it is genuinely per-image (a hero, an editorial figure).
   */
  aspect?: '1/1' | '4/5' | '3/4' | '3/2' | '16/9' | '5/4';
  imageProps?: Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet' | 'sizes' | 'alt' | 'width' | 'height' | 'loading'
  >;
}) {
  const resolved = resolveImage(media, aspect);
  const effectiveAspect = aspect ?? media.aspect;
  const aspectClass = effectiveAspect
    ? (ASPECT_CLASS[effectiveAspect] ?? '')
    : '';

  if (!resolved.src) {
    return <MediaNotConfigured media={media} className={className} />;
  }

  return (
    <img
      src={resolved.src}
      srcSet={resolved.srcSet}
      sizes={resolved.srcSet ? sizes : undefined}
      alt={media.alt}
      width={resolved.width}
      height={resolved.height}
      loading={priority ? 'eager' : 'lazy'}
      // `async` keeps image decoding off the main thread, which matters on a
      // page whose largest paint is a product photograph.
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      className={`object-cover ${aspectClass} ${className}`}
      {...imageProps}
    />
  );
}

/**
 * The failure state when content names a Cloudinary asset but the environment
 * has no cloud configured.
 *
 * Rendered as a visible message rather than an empty box or a broken-image icon,
 * for the same reason BlockRenderer renders an unknown block type by name: a
 * silent hole on production is much more expensive than an obvious one on
 * staging. This is a configuration error an operator can act on, so it says what
 * to do.
 */
function MediaNotConfigured({
  media,
  className,
}: {
  media: MediaDoc;
  className?: string;
}) {
  const publicId = 'publicId' in media ? media.publicId : undefined;

  return (
    <div
      role="img"
      aria-label={media.alt || 'Image unavailable'}
      className={`border-danger text-danger flex items-center justify-center rounded-md border border-dashed p-4 text-center text-micro ${className ?? ''}`}
    >
      <span>
        Image not configured
        {publicId ? (
          <>
            {' — '}
            <code className="font-mono">{publicId}</code>
          </>
        ) : null}
        <br />
        Set <code className="font-mono">VITE_CLOUDINARY_CLOUD_NAME</code> for
        this environment. See <code className="font-mono">docs/environment.md</code>.
      </span>
    </div>
  );
}
