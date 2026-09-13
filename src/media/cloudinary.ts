/**
 * cloudinary.ts — image delivery.
 *
 * WHAT THIS IS AND IS NOT
 * This builds **delivery URLs**. It does not use the Cloudinary SDK, and that is
 * deliberate: a delivery URL is a string of path segments, and the `cloudinary`
 * npm package would add a server-oriented dependency (and its transitive tree) to
 * the browser bundle to do string concatenation. The storefront needs no SDK.
 *
 * The SDK, and the API key + secret, are for the **upload** side, which is
 * server-only and is not built yet — see the note at the bottom of this file.
 *
 * WHY PRESETS LIVE HERE AND NOT IN CONTENT
 * A content author chooses *which image*. The application chooses *how big* and
 * *what crop*. Putting `w_800,c_fill,g_auto` in `site-content/*.json` would let
 * the client set transformation parameters, which means the client could produce
 * a 6000px hero, blow the bandwidth budget, and there would be no single place
 * to fix it. Same principle as the token layer: content names intent, code owns
 * values. `check-no-ad-hoc-values.mjs` enforces the same idea for colours.
 *
 * GRACEFUL DEGRADATION
 * With no `VITE_CLOUDINARY_CLOUD_NAME` set, `resolveImage` falls back to the
 * media's own `src`. Local development and CI therefore work with no Cloudinary
 * account at all, and a misconfigured deploy degrades to "images are unoptimised"
 * rather than "images are broken".
 */

import type { Media } from '../content/types';

/** Public by design: it appears in every delivery URL. Safe in the bundle. */
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME);

export const CLOUDINARY_ORIGIN = 'https://res.cloudinary.com';

// ---------------------------------------------------------------------------
// Transformations
// ---------------------------------------------------------------------------

export interface CloudinaryTransform {
  /** Target width in CSS pixels. */
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'thumb';
  gravity?: 'auto' | 'face' | 'center';
  aspectRatio?: string;
  /** `auto` lets Cloudinary pick the best format for the requesting browser. */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | number;
  dpr?: 'auto' | number;
}

/**
 * Named sizes. Components ask for a preset by name; they never pass numbers.
 * If a surface needs a new size, add a preset — it is a reviewed change with a
 * bandwidth consequence, not a number typed at a call site.
 */
export const CLOUDINARY_PRESETS = {
  /** Full-bleed hero. `limit` so a smaller original is never upscaled. */
  hero: { width: 2000, crop: 'limit' },
  /** 16:9 editorial band. */
  wide: { width: 1600, height: 900, crop: 'fill' },
  /** 3:2 editorial figure. */
  landscape: { width: 1600, height: 1067, crop: 'fill' },
  /** 4:5 product card — the PDP/PLP ratio. */
  portrait: { width: 800, height: 1000, crop: 'fill' },
  /** 1:1 fabric swatch. */
  square: { width: 600, height: 600, crop: 'fill' },
  /** Small inline preview. */
  thumb: { width: 200, height: 200, crop: 'fill' },
} as const satisfies Record<string, CloudinaryTransform>;

export type CloudinaryPreset = keyof typeof CLOUDINARY_PRESETS;

/**
 * Which preset a content `aspect` maps to, so the schema's aspect enum and the
 * delivered crop cannot disagree. Mirrors the `aspect` enum in page.schema.json
 * and the `--aspect-*` tokens in index.css.
 */
const ASPECT_PRESET: Record<string, CloudinaryPreset> = {
  '1/1': 'square',
  '4/5': 'portrait',
  '3/2': 'landscape',
  '16/9': 'wide',
};

const DEFAULT_PRESET: CloudinaryPreset = 'hero';

/** Widths used for responsive `srcset`. Ascending; the browser picks one. */
const SRCSET_WIDTHS = [400, 600, 800, 1200, 1600, 2000];

// ---------------------------------------------------------------------------
// URL construction
// ---------------------------------------------------------------------------

/**
 * Encode a public ID for use in a URL path WITHOUT encoding the slashes —
 * Cloudinary public IDs address folders (`yammaman/fabrics/ai-001`), and encoding
 * the separator breaks delivery.
 */
function encodePublicId(publicId: string): string {
  return publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/** Cloudinary params are `key_value` joined by commas, ordered for cache hits. */
function buildTransform(t: CloudinaryTransform): string {
  const parts: Record<string, string> = {};

  if (t.width) parts.w = String(t.width);
  if (t.height) parts.h = String(t.height);
  if (t.crop) parts.c = t.crop;
  if (t.gravity) parts.g = t.gravity;
  if (t.aspectRatio) parts.ar = t.aspectRatio;
  if (t.dpr) parts.dpr = String(t.dpr);
  // f_auto and q_auto are the whole point of serving through Cloudinary: the
  // browser gets AVIF/WebP where it can, at a quality Cloudinary judges
  // sufficient. Leaving them off means shipping the original bytes.
  parts.f = t.format ?? 'auto';
  parts.q = String(t.quality ?? 'auto');

  return Object.keys(parts)
    .sort()
    .map((k) => `${k}_${parts[k]}`)
    .join(',');
}

/**
 * Build a delivery URL for a public ID.
 *
 * @example
 * cloudinaryUrl('yammaman/fabrics/ai-001', { preset: 'square' })
 * // https://res.cloudinary.com/yqalfmuf/image/upload/c_fill,f_auto,g_auto,h_600,q_auto,w_600/yammaman/fabrics/ai-001
 */
export function cloudinaryUrl(
  publicId: string,
  options: { preset?: CloudinaryPreset; transform?: CloudinaryTransform } = {},
): string {
  if (!CLOUDINARY_CLOUD_NAME) return '';

  const { preset, transform } = options;

  const base: CloudinaryTransform = {
    gravity: 'auto',
    ...(preset ? CLOUDINARY_PRESETS[preset] : {}),
    ...transform,
  };

  return `${CLOUDINARY_ORIGIN}/${CLOUDINARY_CLOUD_NAME}/image/upload/${buildTransform(base)}/${encodePublicId(publicId)}`;
}

/**
 * A responsive `srcset`, so a phone does not download a 2000px hero.
 *
 * `crop: 'limit'` presets are excluded: scaling a "limit" image to six widths
 * would generate variants that are all the original size, which wastes
 * transformations and gains nothing.
 */
export function cloudinarySrcSet(
  publicId: string,
  options: { preset?: CloudinaryPreset; transform?: CloudinaryTransform } = {},
): string | undefined {
  if (!CLOUDINARY_CLOUD_NAME) return undefined;

  const { preset, transform } = options;
  const base: CloudinaryTransform = {
    gravity: 'auto',
    ...(preset ? CLOUDINARY_PRESETS[preset] : {}),
    ...transform,
  };

  if (base.crop === 'limit') return undefined;

  return SRCSET_WIDTHS.filter((w) => !base.width || w <= base.width * 1.5)
    .map((w) => {
      // Keep the aspect ratio when widening, so the crop does not drift.
      const height =
        base.width && base.height
          ? Math.round((base.height / base.width) * w)
          : base.height;
      return `${cloudinaryUrl(publicId, {
        transform: { ...base, width: w, height },
      })} ${w}w`;
    })
    .join(', ');
}

// ---------------------------------------------------------------------------
// The component-facing entry point
// ---------------------------------------------------------------------------

export interface ResolvedImage {
  src: string;
  srcSet?: string;
  /** Intrinsic size, used to reserve layout space and prevent CLS. */
  width?: number;
  height?: number;
  /**
   * True for local assets and for the no-Cloudinary fallback. A local SVG
   * placeholder must not be pushed through a transformation pipeline.
   */
  unoptimized: boolean;
}

/**
 * Turn a content `Media` into something an <img> can render.
 *
 * This is where "local path vs Cloudinary public ID" stops mattering to every
 * caller. Blocks do not branch on it; they render `<Media>`.
 *
 * `aspectOverride` exists because a surface can force a ratio (the fabric grid is
 * always square). When it does, the Cloudinary crop must follow the override —
 * reserving a 1:1 box in CSS while delivering a 4:5 crop would letterbox the
 * image and look like a broken transform.
 */
export function resolveImage(
  media: Media,
  aspectOverride?: string,
): ResolvedImage {
  const aspect = aspectOverride ?? media.aspect;

  // --- Cloudinary -----------------------------------------------------------
  if ('publicId' in media && media.publicId) {
    const preset = (aspect && ASPECT_PRESET[aspect]) || DEFAULT_PRESET;
    // Annotated because `CLOUDINARY_PRESETS` is `as const`: without this, TS
    // narrows to the union of the literal preset objects, and `hero` (a `limit`
    // crop with no fixed height) makes `transform.height` a type error on a
    // union member. The presets are all valid CloudinaryTransform values; `as
    // const` is for the keys, not for narrowing the shape.
    const transform: CloudinaryTransform = CLOUDINARY_PRESETS[preset];

    if (isCloudinaryConfigured) {
      return {
        src: cloudinaryUrl(media.publicId, { preset }),
        srcSet: cloudinarySrcSet(media.publicId, { preset }),
        width: transform.width,
        height: transform.height,
        unoptimized: false,
      };
    }

    // Configured in content but not in the environment. Falling back to a
    // data-URI here would hide a real deployment mistake, so return the empty
    // string and let Media render its explicit "not configured" state.
    return { src: '', unoptimized: true };
  }

  // --- Local path or absolute URL ------------------------------------------
  const src = 'src' in media && media.src ? media.src : '';
  return { src, unoptimized: true };
}

// ---------------------------------------------------------------------------
// NOT BUILT: upload
// ---------------------------------------------------------------------------
// Uploading requires the API key AND the secret, which must never reach the
// browser. It therefore needs a server endpoint that signs the request; a
// `VITE_` variable cannot hold it (anything `VITE_` is compiled into the
// public bundle — see docs/environment.md).
//
// It is deliberately not built yet, because the decisions it depends on are
// still open: who may upload (workers uploading fabric jpgs, and Noi uploading
// content images, are different authorisation cases per PRD §3), and whether
// uploads go through the harness or the storefront at all. Writing it now would
// mean guessing the auth model and rewriting it later.
//
// Where the credentials go when it does get built:
//   CLOUDINARY_API_KEY     — server-side environment, not VITE_
//   CLOUDINARY_API_SECRET  — server-side environment, never in this repo
// See docs/environment.md.
