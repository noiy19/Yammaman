import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { CommerceProvider } from './commerce/CommerceProvider';
import { listPages, listTenants, loadPage } from './content/loadContent';
import { getTenant } from './tenant/tenants';

/**
 * Render smoke tests.
 *
 * These exist because typechecking proves the props fit and NOTHING ELSE. The
 * bugs this catches are the ones that only appear at render time: a block that
 * reads `props.cta.label` when `cta` is optional, a component that touches
 * `window` during render, a circular import that resolves to undefined. Every
 * page in site-content/ is rendered in full — all 8 documents, both tenants —
 * so a block that throws on a shape the schema permits fails here.
 *
 * `renderToString` (not a DOM renderer) is deliberate: it needs no jsdom, it is
 * fast, and it happens to enforce exactly the discipline the app already claims —
 * render must not depend on browser globals. Effects do not run under it, which
 * is fine: effects are not what this test is about.
 */
function render(path: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <CommerceProvider>
        <App />
      </CommerceProvider>
    </MemoryRouter>,
  );
}

const allPages = listTenants().flatMap((t) =>
  listPages(t).map((p) => [p.path, t.name, p] as const),
);

describe('every page renders', () => {
  it.each(allPages)('%s (%s)', (path, _tenantName, page) => {
    const html = render(path);

    expect(html.length).toBeGreaterThan(0);

    // The document's own title and the first block's heading must appear, so a
    // silently-empty render cannot pass by producing the chrome alone.
    const heroHeading = page.blocks[0];
    expect(heroHeading.type).toBe('hero');
    if (heroHeading.type === 'hero') {
      expect(html).toContain(heroHeading.props.heading);
    }

    // Every block type on the page must have produced its own markup, not been
    // dropped by the "Unknown block type" branch.
    expect(html).not.toContain('Unknown block type');
  });
});

describe('tenant isolation holds in the render', () => {
  /**
   * Read the discriminators OUT OF THE CONTENT rather than hard-coding them.
   *
   * This block previously asserted literal copy ("Cloth with a hundred years
   * behind it", "Two factories left"). That coupled a `src/` test to
   * `site-content/` strings, which breaks the project's own lane separation:
   * `site-content/` is the CLIENT lane and `src/` is Muen's, and the lane gate
   * exists precisely so a content edit never requires a code change. A hard-coded
   * copy assertion means the client cannot reword a headline without turning CI
   * red — a code PR for a content edit, which is what we designed against.
   */
  type PageRef = [tenantId: string, pageId: string];

  /** Every short piece of human-readable copy on a page's blocks. */
  function copyOn([tenantId, pageId]: PageRef): string[] {
    const page = loadPage(getTenant(tenantId), pageId);
    if (!page) throw new Error(`no page ${tenantId}/${pageId}`);
    const out: string[] = [];
    for (const block of page.blocks) {
      const props = block.props as Record<string, unknown>;
      for (const key of ['eyebrow', 'heading', 'subheading']) {
        const value = props[key];
        if (typeof value === 'string' && value.trim().length > 0) out.push(value);
      }
    }
    return out;
  }

  /**
   * Pick a string that occurs on `subject` and NOT anywhere in `other`, so it can
   * actually prove isolation.
   *
   * Choosing by hand is what broke first time: the mill's hero heading is
   * "HARAPPA", and the brand home legitimately contains that word — in the
   * header cross-link and in its own subheading. So the test failed for a good
   * reason, and the fix is to let the content decide. Longest exclusive string
   * wins, because longer strings are far less likely to collide by accident.
   *
   * If no exclusive string exists the pages have genuinely converged, and that is
   * worth failing loudly rather than silently testing nothing.
   */
  function exclusiveCopy(subject: PageRef, other: PageRef): string {
    const otherText = copyOn(other).join('\n');
    const candidates = copyOn(subject).filter(
      (s) => s.length >= 8 && !otherText.includes(s),
    );
    if (candidates.length === 0) {
      throw new Error(
        `no copy exclusive to ${subject.join('/')} vs ${other.join('/')}: ` +
          'the two surfaces have converged, so tenant isolation cannot be asserted this way',
      );
    }
    return candidates.sort((a, b) => b.length - a.length)[0];
  }

  const BRAND_HOME: PageRef = ['yammaman-brand', 'home'];
  const MILL_HOME: PageRef = ['yammaman-textile-mill', 'home'];

  const BRAND_ONLY = exclusiveCopy(BRAND_HOME, MILL_HOME);
  const MILL_ONLY = exclusiveCopy(MILL_HOME, BRAND_HOME);

  it('derived real, mutually exclusive copy — not empty strings', () => {
    // Guards the guard: if these came back empty, every `not.toContain` below
    // would pass vacuously and the suite would test nothing.
    expect(BRAND_ONLY.length).toBeGreaterThan(0);
    expect(MILL_ONLY.length).toBeGreaterThan(0);
    expect(BRAND_ONLY).not.toBe(MILL_ONLY);
  });

  it('does not leak mill content onto the brand surface', () => {
    const brandHome = render('/');
    expect(brandHome).toContain(BRAND_ONLY);
    expect(brandHome).not.toContain(MILL_ONLY);
  });

  it('renders the mill at /mill and not the brand home', () => {
    const mill = render('/mill');
    expect(mill).toContain(MILL_ONLY);
    expect(mill).not.toContain(BRAND_ONLY);
  });

  it('keeps the two surfaces apart on a shared pageId', () => {
    // Both tenants have a page called 'story', at different paths. Rendering
    // each must produce that tenant's document.
    const brandStory = exclusiveCopy(
      ['yammaman-brand', 'story'],
      ['yammaman-textile-mill', 'story'],
    );
    const millStory = exclusiveCopy(
      ['yammaman-textile-mill', 'story'],
      ['yammaman-brand', 'story'],
    );

    expect(brandStory).not.toBe(millStory);
    expect(render('/story')).toContain(brandStory);
    expect(render('/story')).not.toContain(millStory);
    expect(render('/mill/story')).toContain(millStory);
    expect(render('/mill/story')).not.toContain(brandStory);
  });
});

describe('unknown paths', () => {
  it('renders a not-found page inside the tenant chrome, not a crash', () => {
    const html = render('/definitely-not-a-page');
    expect(html).toContain('Page not found');
  });
});
