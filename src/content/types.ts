/**
 * types.ts — the TypeScript view of the content schema.
 *
 * SOURCE OF TRUTH: content/schema/page.schema.json
 * This file mirrors it. The two are kept honest by
 * `pnpm run content:validate`, which validates every document in
 * site-content/ against the schema in CI. If you add a block type, you change
 * BOTH — schema first, then here, then the registry.
 *
 * Why hand-written rather than generated: the schema is the contract the
 * CLIENT's content is checked against and this is the contract the CODE is
 * checked against. Generating one from the other makes a schema change silently
 * a code change. Keeping them separate means a mismatch is a build failure,
 * which is the point.
 */

/** PRD FR-12: ids are stable config, lowercase kebab, never renumbered. */
export type StableId = string;

/**
 * An image reference. Exactly one of `src` / `publicId`.
 *
 * Expressed as a union rather than "both optional" so that TypeScript, the JSON
 * schema, and every consumer agree on the same rule. A precedence rule ("use
 * publicId if present, else src") would make a document render differently
 * depending on which field an author happened to fill in, and neither the schema
 * nor the typechecker could catch it.
 */
interface MediaBase {
  /** Required. '' is a deliberate decorative declaration; a MISSING alt is a bug. */
  alt: string;
  /** `1/1` | `4/5` | `3/2` | `16/9` — drives the CSS box AND the Cloudinary crop. */
  aspect?: '1/1' | '4/5' | '3/2' | '16/9';
  credit?: string;
}

/** A local path served from public/, or an absolute https URL. */
export interface LocalMedia extends MediaBase {
  src: string;
  publicId?: never;
}

/**
 * A Cloudinary public ID. Transformation parameters are deliberately absent:
 * the app chooses width, crop and quality from named presets in
 * src/media/cloudinary.ts, so content cannot produce a 6000px hero.
 */
export interface CloudinaryMedia extends MediaBase {
  publicId: string;
  src?: never;
}

export type Media = LocalMedia | CloudinaryMedia;

export interface Link {
  label: string;
  href: string;
}

export interface HeroBlock {
  id: StableId;
  type: 'hero';
  props: {
    eyebrow?: string;
    heading: string;
    subheading?: string;
    align?: 'start' | 'center';
    image?: Media;
    cta?: Link;
  };
}

export interface ProseBlock {
  id: StableId;
  type: 'prose';
  props: {
    heading?: string;
    body: string[];
    tone?: 'lead' | 'body';
  };
}

export interface FigureBlock {
  id: StableId;
  type: 'figure';
  props: { image: Media; caption?: string };
}

export interface StepsBlock {
  id: StableId;
  type: 'steps';
  props: {
    heading?: string;
    intro?: string;
    steps: { title: string; body: string }[];
  };
}

export interface ProductGridBlock {
  id: StableId;
  type: 'productGrid';
  props: {
    heading?: string;
    intro?: string;
    /** Which slice of the engine catalogue to render. The engine owns products; this selects. */
    source: 'in-stock' | 'made-to-order' | 'collection';
    limit?: number;
    columns?: 2 | 3 | 4;
  };
}

export interface FabricCatalogBlock {
  id: StableId;
  type: 'fabricCatalog';
  props: {
    heading?: string;
    intro?: string;
    /** FR-2: out-of-stock becomes made-to-order; it never leaves the catalog. */
    showAvailability: boolean;
  };
}

export interface FaqBlock {
  id: StableId;
  type: 'faq';
  props: {
    heading?: string;
    intro?: string;
    /** FR-5: this list is also the preset script the FAQ-first chat answers from. */
    items: { question: string; answer: string }[];
  };
}

export interface StoresBlock {
  id: StableId;
  type: 'stores';
  props: {
    heading?: string;
    stores: {
      name: string;
      addressLines: string[];
      hours?: string;
      phone?: string;
      mapHref?: string;
    }[];
  };
}

export interface ContactFormBlock {
  id: StableId;
  type: 'contactForm';
  props: {
    heading: string;
    intro?: string;
    channels: Link[];
  };
}

export interface CallToActionBlock {
  id: StableId;
  type: 'callToAction';
  props: {
    heading: string;
    body?: string;
    tone?: 'neutral' | 'inverted';
    cta: Link;
  };
}

export type Block =
  | HeroBlock
  | ProseBlock
  | FigureBlock
  | StepsBlock
  | ProductGridBlock
  | FabricCatalogBlock
  | FaqBlock
  | StoresBlock
  | ContactFormBlock
  | CallToActionBlock;

export type BlockType = Block['type'];

/** Narrow a Block to one variant — used by the registry to type each component. */
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

export interface PageDoc {
  tenantId: StableId;
  pageId: StableId;
  path: string;
  title: string;
  /** Non-rendered provenance. Never shown to a visitor. */
  note?: string;
  seo?: { title?: string; description: string };
  blocks: Block[];
}
