/**
 * storyFixtures.ts — sample blocks for Storybook.
 *
 * These are the shapes the content schema permits, with the extremes included
 * on purpose: the longest realistic heading, a block with every optional field
 * omitted, a block with all of them present. A story that only ever shows the
 * happy middle hides the layout bugs that appear at the edges — and the edges
 * are exactly where client-authored content lands.
 */

import type {
  BlockOf,
  BlockType,
  CallToActionBlock,
  ContactFormBlock,
  FabricCatalogBlock,
  FaqBlock,
  FigureBlock,
  HeroBlock,
  ProductGridBlock,
  ProseBlock,
  StoresBlock,
  StepsBlock,
} from '../../content/types';

const img = (label: string, hue: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">` +
      `<rect width="120" height="150" fill="${hue}"/>` +
      `<text x="60" y="79" font-family="serif" font-size="13" fill="#ffffff" ` +
      `text-anchor="middle">${label}</text></svg>`,
  );

export const heroBlock: HeroBlock = {
  id: 'story-hero',
  type: 'hero',
  props: {
    eyebrow: 'Aizu, Japan · est. 2008',
    heading: 'Cloth with a hundred years behind it',
    subheading:
      'Made-to-order clothing woven on the HARAPPA mill — one of two remaining Aizu Momen factories.',
    align: 'start',
    cta: { label: 'See the collection', href: '/collection' },
  },
};

/** The minimum the schema allows: heading only, every optional field absent. */
export const heroMinimalBlock: HeroBlock = {
  id: 'story-hero-minimal',
  type: 'hero',
  props: { heading: 'Heading only' },
};

export const proseBlock: ProseBlock = {
  id: 'story-prose',
  type: 'prose',
  props: {
    heading: 'Why this cloth',
    tone: 'body',
    body: [
      'Aizu Momen is a cotton woven with a technique brought to Fukushima in the nineteenth century.',
      'The count of surviving mills is the reason YAMMA exists.',
    ],
  },
};

export const figureBlock: FigureBlock = {
  id: 'story-figure',
  type: 'figure',
  props: {
    image: {
      src: img('Loom', '#2f4f6f'),
      alt: 'Placeholder for a photograph of the mill floor',
      aspect: '3/2',
    },
    caption: 'Placeholder image — to be replaced with mill photography.',
  },
};

export const stepsBlock: StepsBlock = {
  id: 'story-steps',
  type: 'steps',
  props: {
    heading: 'Made to order, step by step',
    intro: 'A made-to-order garment is a four-month relationship.',
    steps: [
      { title: '1 — Choose the cloth', body: 'Pick from the fabric catalog.' },
      { title: '2 — Place the deposit', body: 'Paid as a deposit up front.' },
      { title: '3 — The mill weaves', body: 'Three to four months.' },
      { title: '4 — Balance, then shipping', body: 'Settled when finished.' },
    ],
  },
};

export const productGridBlock: ProductGridBlock = {
  id: 'story-product-grid',
  type: 'productGrid',
  props: {
    heading: 'In stock now',
    intro: 'Pieces that are already cut and can ship immediately.',
    source: 'in-stock',
    limit: 6,
    columns: 3,
  },
};

export const fabricCatalogBlock: FabricCatalogBlock = {
  id: 'story-fabric-catalog',
  type: 'fabricCatalog',
  props: {
    heading: 'The fabric catalog',
    showAvailability: true,
  },
};

export const faqBlock: FaqBlock = {
  id: 'story-faq',
  type: 'faq',
  props: {
    heading: 'Common questions',
    items: [
      {
        question: 'How long does a made-to-order piece take?',
        answer: 'Three to four months.',
      },
      {
        question: 'What if the fabric I want is out of stock?',
        answer: 'Out of stock does not mean unavailable.',
      },
    ],
  },
};

export const storesBlock: StoresBlock = {
  id: 'story-stores',
  type: 'stores',
  props: {
    heading: 'Stockists',
    stores: [
      {
        name: 'YAMMA Atelier',
        addressLines: ['2-1 Nanokamachi', 'Aizuwakamatsu, Fukushima 965-0044', 'Japan'],
        hours: 'Thu–Mon, 11:00–18:00',
        phone: '+81 242 00 0000',
      },
      {
        name: 'Placeholder Stockist — Tokyo',
        addressLines: ['0-0-0 Example', 'Shibuya, Tokyo 150-0000', 'Japan'],
      },
    ],
  },
};

export const contactFormBlock: ContactFormBlock = {
  id: 'story-contact',
  type: 'contactForm',
  props: {
    heading: 'Ask us directly',
    intro: 'You will get a ticket number and a reply by email.',
    channels: [{ label: 'hello@yammaman.example', href: 'https://yammaman.example' }],
  },
};

export const callToActionBlock: CallToActionBlock = {
  id: 'story-cta',
  type: 'callToAction',
  props: {
    heading: 'Not sure where to start?',
    body: 'Read how a made-to-order piece actually gets made.',
    tone: 'neutral',
    cta: { label: 'How to order', href: '/how-to-order' },
  },
};

export const callToActionInvertedBlock: CallToActionBlock = {
  id: 'story-cta-inverted',
  type: 'callToAction',
  props: {
    heading: 'Not sure where to start?',
    body: 'Read how a made-to-order piece actually gets made.',
    tone: 'inverted',
    cta: { label: 'How to order', href: '/how-to-order' },
  },
};

/** One representative block per registry key — used by the contract gate. */
export const oneBlockPerType: { [T in BlockType]: BlockOf<T> } = {
  hero: heroBlock,
  prose: proseBlock,
  figure: figureBlock,
  steps: stepsBlock,
  productGrid: productGridBlock,
  fabricCatalog: fabricCatalogBlock,
  faq: faqBlock,
  stores: storesBlock,
  contactForm: contactFormBlock,
  callToAction: callToActionBlock,
};
