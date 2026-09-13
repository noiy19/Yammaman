import type { ComponentType } from 'react';
import type { Block, BlockType } from '../content/types';

import { Hero } from './Hero';
import { Prose } from './Prose';
import { Figure } from './Figure';
import { Steps } from './Steps';
import { ProductGrid } from './ProductGrid';
import { FabricCatalog } from './FabricCatalog';
import { Faq } from './Faq';
import { Stores } from './Stores';
import { ContactForm } from './ContactForm';
import { CallToAction } from './CallToAction';

/**
 * registry.ts — block type → component.
 *
 * THE PATTERN LIBRARY. PRD FR-9 lets the client add and reorder blocks from this
 * set but never author a new type: a new type is a React component, and that is
 * functionality, which is Muen-only. So this map is the exact boundary of the
 * client sandbox expressed in code — if a type is in here, the client may place
 * it; if it is not, the content schema rejects the document and the lane gate
 * flags the PR.
 *
 * The mapped type keeps each component's props narrowed to its own variant, so
 * <Hero> cannot be handed a faq block.
 */
type BlockComponent<T extends BlockType> = ComponentType<{
  block: Extract<Block, { type: T }>;
}>;

export const BLOCK_REGISTRY = {
  hero: Hero,
  prose: Prose,
  figure: Figure,
  steps: Steps,
  productGrid: ProductGrid,
  fabricCatalog: FabricCatalog,
  faq: Faq,
  stores: Stores,
  contactForm: ContactForm,
  callToAction: CallToAction,
} satisfies { [T in BlockType]: BlockComponent<T> };

export const KNOWN_BLOCK_TYPES = Object.keys(BLOCK_REGISTRY) as BlockType[];

export function isKnownBlockType(type: string): type is BlockType {
  return Object.prototype.hasOwnProperty.call(BLOCK_REGISTRY, type);
}
