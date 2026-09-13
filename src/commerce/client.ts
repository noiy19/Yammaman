/**
 * client.ts — the seam between the storefront and the commerce engine.
 *
 * PRD §7: catalogue, orders, payments, invoices and trays are NOT ours. They
 * live in Pratap's custom engine (OMS + CMS) behind a Swagger/OpenAPI surface.
 * This interface is the storefront's half of that contract.
 *
 * WHY AN INTERFACE AND A FIXTURE INSTEAD OF A FETCH CALL
 * The engine API rundown is an OPEN ITEM (tech-stack.md): endpoint shapes, the
 * CMS-vs-OMS split, and the auth model are not confirmed. Writing fetch calls
 * against guessed endpoints would produce code that looks finished and is
 * wrong. So the storefront is written against this interface, the fixture
 * satisfies it, and swapping in the real client is one file — with no call site
 * touched. That is the difference between "blocked on the API rundown" and
 * "blocked on the API rundown but able to build the whole front end".
 *
 * WHAT THE ENGINE OWNS (do not reimplement here):
 *   catalogue · orders · payments · invoices · trays · customers · staff login
 * WHAT WE OWN:
 *   presentation, content, task-scoped auth for the harness, tickets, AI worker
 *
 * SECRETS: the live TenantApiKey never reaches the browser. The real client must
 * talk to a server-side proxy; anything in a VITE_* var is public. See
 * .env.example.
 */

import type { Media } from '../content/types';

export interface Product {
  productId: string;
  name: string;
  /** Denormalised for display; the engine remains the source of truth. */
  priceLabel: string;
  /**
   * Typed as the content layer's `Media`, so an image is delivered through the
   * same pipeline whether it came from content JSON or from the engine. The
   * engine may return either a direct URL or a Cloudinary public ID; the
   * storefront does not care which.
   */
  image: Media;
  availability: 'in-stock' | 'made-to-order';
}

export interface Fabric {
  fabricId: string;
  name: string;
  /** The worker-uploaded jpg. FR-2: this single swatch feeds site AND pipeline. */
  swatch: Media;
  availability: 'in-stock' | 'made-to-order' | 'unavailable';
  /** Set once Noi approves a diffusion result (FR-3). */
  previewImage?: Media;
}

export interface CommerceClient {
  listProducts(query?: {
    source?: 'in-stock' | 'made-to-order' | 'collection';
    limit?: number;
  }): Promise<Product[]>;
  listFabrics(): Promise<Fabric[]>;
  getFabric(fabricId: string): Promise<Fabric | undefined>;
}

export class CommerceNotConfiguredError extends Error {
  constructor() {
    super(
      'The commerce engine is not configured. Set VITE_COMMERCE_API_BASE once ' +
        'the API rundown lands (tech-stack.md, open items), or keep using the ' +
        'fixture client for design work.',
    );
    this.name = 'CommerceNotConfiguredError';
  }
}

export const COMMERCE_API_BASE = import.meta.env.VITE_COMMERCE_API_BASE as
  | string
  | undefined;

/** True when the storefront should call the real engine rather than fixtures. */
export const hasLiveCommerce = Boolean(COMMERCE_API_BASE);
