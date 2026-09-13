import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The delivery URL is a contract with a third party, and it fails quietly: a
 * malformed transformation string does not throw, it returns an image that is
 * too large, wrongly cropped, or not optimised at all. Nobody notices until the
 * bandwidth bill or a visual review. So the exact string is asserted rather than
 * loosely matched.
 *
 * The module reads `import.meta.env` at import time, so testing the configured
 * and unconfigured states means re-importing it with the env stubbed.
 */
async function loadModule(cloudName: string | undefined) {
  vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', cloudName ?? '');
  vi.resetModules();
  return import('./cloudinary');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('cloudinaryUrl', () => {
  it('builds the exact transformation string for a preset', async () => {
    const { cloudinaryUrl } = await loadModule('testcloud');

    expect(cloudinaryUrl('shoes', { preset: 'square' })).toBe(
      'https://res.cloudinary.com/testcloud/image/upload/' +
        'c_fill,f_auto,g_auto,h_600,q_auto,w_600/shoes',
    );
  });

  it('always requests auto format and auto quality', async () => {
    // These two params ARE the reason to serve through Cloudinary. If they go
    // missing the site still works and silently ships original bytes.
    const { cloudinaryUrl } = await loadModule('testcloud');
    const url = cloudinaryUrl('shoes', { preset: 'portrait' });

    expect(url).toContain('f_auto');
    expect(url).toContain('q_auto');
  });

  it('keeps folder separators in a public ID', async () => {
    const { cloudinaryUrl } = await loadModule('testcloud');

    expect(cloudinaryUrl('yammaman/fabrics/ai-001', { preset: 'thumb' })).toContain(
      '/yammaman/fabrics/ai-001',
    );
  });

  it('encodes characters that would break the path', async () => {
    const { cloudinaryUrl } = await loadModule('testcloud');

    // Without encoding, a space produces a URL that 404s or, worse, silently
    // resolves to a different asset.
    expect(cloudinaryUrl('fabric swatches/ai 001')).toContain(
      '/fabric%20swatches/ai%20001',
    );
  });

  it('orders parameters alphabetically, so the same transform has one URL', async () => {
    // Cloudinary charges and caches per derived URL. Two spellings of the same
    // transformation would be two cache entries and two transformations.
    const { cloudinaryUrl } = await loadModule('testcloud');
    const url = cloudinaryUrl('shoes', { preset: 'square' });
    const paramString = url.split('/upload/')[1].split('/')[0];

    expect(paramString.split(',')).toEqual([...paramString.split(',')].sort());
  });

  it('returns an empty string when no cloud is configured', async () => {
    const { cloudinaryUrl, isCloudinaryConfigured } = await loadModule(undefined);

    expect(isCloudinaryConfigured).toBe(false);
    expect(cloudinaryUrl('shoes', { preset: 'square' })).toBe('');
  });
});

describe('cloudinarySrcSet', () => {
  it('offers several widths with descriptors', async () => {
    const { cloudinarySrcSet } = await loadModule('testcloud');
    const srcSet = cloudinarySrcSet('shoes', { preset: 'square' });

    expect(srcSet).toBeDefined();
    const entries = srcSet!.split(', ');
    expect(entries.length).toBeGreaterThan(1);
    for (const entry of entries) expect(entry).toMatch(/ \d+w$/);
    expect(srcSet).toContain('400w');
  });

  it('preserves the aspect ratio across widths', async () => {
    const { cloudinarySrcSet } = await loadModule('testcloud');
    // portrait is 800x1000, i.e. 4:5. Each candidate must keep that ratio or
    // the browser would swap in a differently-cropped image mid-resize.
    const srcSet = cloudinarySrcSet('shoes', { preset: 'portrait' })!;

    for (const entry of srcSet.split(', ')) {
      const w = Number(entry.match(/w_(\d+)/)![1]);
      const h = Number(entry.match(/h_(\d+)/)![1]);
      expect(h / w).toBeCloseTo(1000 / 800, 2);
    }
  });

  it('is omitted for a `limit` crop', async () => {
    // `limit` never upscales, so every "width" would return the same original —
    // six derived transformations that all cost money and change nothing.
    const { cloudinarySrcSet } = await loadModule('testcloud');

    expect(cloudinarySrcSet('shoes', { preset: 'hero' })).toBeUndefined();
  });

  it('is omitted when no cloud is configured', async () => {
    const { cloudinarySrcSet } = await loadModule(undefined);

    expect(cloudinarySrcSet('shoes', { preset: 'square' })).toBeUndefined();
  });
});

describe('resolveImage', () => {
  it('resolves a public ID through the preset implied by its aspect', async () => {
    const { resolveImage } = await loadModule('testcloud');
    const resolved = resolveImage({ publicId: 'ai-001', alt: '', aspect: '1/1' });

    expect(resolved.unoptimized).toBe(false);
    expect(resolved.width).toBe(600);
    expect(resolved.height).toBe(600);
    expect(resolved.srcSet).toBeDefined();
    expect(resolved.src).toContain('/ai-001');
  });

  it('lets a forced aspect override the content aspect', async () => {
    // The fabric grid forces 1:1. Reserving a 1:1 box while delivering a 4:5
    // crop would letterbox every swatch, so the crop must follow the override.
    const { resolveImage } = await loadModule('testcloud');
    const resolved = resolveImage(
      { publicId: 'ai-001', alt: '', aspect: '4/5' },
      '1/1',
    );

    expect(resolved.width).toBe(600);
    expect(resolved.height).toBe(600);
  });

  it('passes a local path through untouched', async () => {
    const { resolveImage } = await loadModule('testcloud');
    const resolved = resolveImage({ src: '/assets/mill.svg', alt: 'Mill' });

    expect(resolved).toEqual({
      src: '/assets/mill.svg',
      unoptimized: true,
    });
  });

  it('yields an empty src (not a broken URL) when Cloudinary is unconfigured', async () => {
    // This is the case that must be loud: content names a Cloudinary asset but
    // the environment cannot deliver it. Returning a plausible URL would hide a
    // deployment error behind a broken image; returning '' makes <Media> render
    // an explicit, actionable message.
    const { resolveImage } = await loadModule(undefined);
    const resolved = resolveImage({ publicId: 'ai-001', alt: '' });

    expect(resolved.src).toBe('');
  });

  it('defaults to the hero preset when no aspect is given', async () => {
    const { resolveImage } = await loadModule('testcloud');
    const resolved = resolveImage({ publicId: 'x', alt: '' });

    expect(resolved.width).toBe(2000);
  });
});
