/**
 * fixture.ts — a stand-in for the commerce engine.
 *
 * Satisfies CommerceClient with static data so every storefront surface can be
 * built, reviewed and screenshot-tested before the engine API rundown lands.
 *
 * THIS IS NOT SEED DATA and must never be mistaken for it. The images are
 * generated placeholders, the names are invented, and the prices are fake. It is
 * deleted the day the real client is wired.
 */

import type { CommerceClient, Fabric, Product } from './client';

const swatch = (label: string, hue: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">` +
      `<rect width="120" height="150" fill="${hue}"/>` +
      `<text x="60" y="79" font-family="serif" font-size="13" fill="#ffffff" ` +
      `text-anchor="middle">${label}</text></svg>`,
  );

const PRODUCTS: Product[] = [
  {
    productId: 'yam-shirt-01',
    name: 'Aizu Cotton Shirt',
    priceLabel: '$280',
    image: { src: swatch('Shirt', '#2f4f6f'), alt: 'Placeholder: Aizu cotton shirt' },
    availability: 'in-stock',
  },
  {
    productId: 'yam-jacket-01',
    name: 'Indigo Work Jacket',
    priceLabel: '$540',
    image: { src: swatch('Jacket', '#1f3a55'), alt: 'Placeholder: indigo work jacket' },
    availability: 'in-stock',
  },
  {
    productId: 'yam-trouser-01',
    name: 'Wide Trouser',
    priceLabel: '$320',
    image: { src: swatch('Trouser', '#43302b'), alt: 'Placeholder: wide trouser' },
    availability: 'in-stock',
  },
  {
    productId: 'yam-coat-01',
    name: 'MTO Overcoat',
    priceLabel: '$1,180 · deposit $354',
    image: { src: swatch('Coat', '#5c463f'), alt: 'Placeholder: made-to-order overcoat' },
    availability: 'made-to-order',
  },
  {
    productId: 'yam-dress-01',
    name: 'MTO Shift Dress',
    priceLabel: '$460 · deposit $138',
    image: { src: swatch('Dress', '#77605a'), alt: 'Placeholder: made-to-order dress' },
    availability: 'made-to-order',
  },
  {
    productId: 'yam-vest-01',
    name: 'MTO Vest',
    priceLabel: '$290 · deposit $87',
    image: { src: swatch('Vest', '#4a6b8a'), alt: 'Placeholder: made-to-order vest' },
    availability: 'made-to-order',
  },
];

const FABRICS: Fabric[] = [
  {
    fabricId: 'ai-001',
    name: 'Aizu Momen — plain weave',
    swatch: { src: swatch('ai-001', '#2f4f6f'), alt: 'Placeholder swatch: plain weave' },
    availability: 'in-stock',
  },
  {
    fabricId: 'ai-002',
    name: 'Aizu Momen — stripe',
    swatch: { src: swatch('ai-002', '#1f3a55'), alt: 'Placeholder swatch: stripe' },
    availability: 'in-stock',
  },
  {
    fabricId: 'ai-003',
    name: 'Aizu Momen — kasuri',
    swatch: { src: swatch('ai-003', '#43302b'), alt: 'Placeholder swatch: kasuri' },
    availability: 'made-to-order',
  },
  {
    fabricId: 'ai-004',
    name: 'Heavy canvas',
    swatch: { src: swatch('ai-004', '#5c463f'), alt: 'Placeholder swatch: heavy canvas' },
    availability: 'made-to-order',
  },
  {
    fabricId: 'ai-005',
    name: 'Fine shirting',
    swatch: { src: swatch('ai-005', '#4a6b8a'), alt: 'Placeholder swatch: fine shirting' },
    availability: 'unavailable',
  },
];

export const fixtureCommerceClient: CommerceClient = {
  async listProducts(query) {
    const { source = 'collection', limit } = query ?? {};
    const filtered =
      source === 'collection'
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.availability === source);
    return limit ? filtered.slice(0, limit) : filtered;
  },

  async listFabrics() {
    return FABRICS;
  },

  async getFabric(fabricId) {
    return FABRICS.find((f) => f.fabricId === fabricId);
  },
};
