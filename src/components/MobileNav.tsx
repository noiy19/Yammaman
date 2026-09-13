import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Container } from './Container';
import { ThemeToggle } from './ThemeToggle';
import type { PageDoc } from '../content/types';

/**
 * MobileNav — the hamburger and its fullscreen panel.
 *
 * WHY THIS EXISTS
 * The reference template has no usable navigation below tablet: at 390px, four
 * of its five nav links measure at x=393–753, entirely past the viewport, with
 * no control to reach them. At 768 the same links fit — which is precisely why
 * no desktop review catches it. A nav that cannot be reached is not a responsive
 * nav, so this is a rebuild rather than a restyle. See
 * ~/.kun/mitsu/skills/responsive-nav.
 *
 * WHAT MAKES IT A MODAL AND NOT A HIDDEN DIV
 * The hamburger is the easy half. The rest is the contract a modal owes, and
 * every part of it is here because leaving it out breaks a real user:
 *
 *   - focus moves INTO the panel on open (otherwise the next Tab walks the page
 *     behind it)
 *   - Tab is trapped inside (wrapping first <-> last)
 *   - focus RETURNS to the trigger on close (otherwise closing drops focus to
 *     <body> and teleports a keyboard user to the top of the document)
 *   - Escape closes
 *   - document scroll is locked while open, and the PREVIOUS value restored —
 *     not '', which would clobber another component's inline style
 *   - closing on route change, because the panel covers the page it navigated to
 *
 * Links are real links, not divs with handlers: middle-click, "open in new tab"
 * and the status-bar preview all have to keep working in a menu.
 */
export function MobileNav({
  pages,
  tenantName,
  sibling,
}: {
  pages: PageDoc[];
  tenantName: string;
  sibling?: { name: string; basePath: string };
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the control that opened it. Without this, closing the
    // panel leaves focus on a removed node.
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!nodes || nodes.length === 0) return;
      const list = [...nodes];
      const first = list[0];
      const last = list[list.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label="Menu"
        className="border-line text-ink hover:bg-hover inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      </button>

      {open ? (
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="bg-surface fixed inset-0 z-50 flex flex-col md:hidden"
        >
          <Container className="flex flex-1 flex-col py-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-ink tracking-brand text-xl">
                {tenantName}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="border-line text-ink hover:bg-hover inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav aria-label="Primary" className="mt-10">
              <ul className="flex list-none flex-col gap-4 p-0">
                {pages.map((page) => (
                  <li key={page.pageId}>
                    <NavLink
                      to={page.path}
                      end={page.path === '/'}
                      onClick={close}
                      className={({ isActive }) =>
                        `display-lockup text-3xl no-underline ${
                          isActive ? 'text-ink' : 'text-ink-secondary'
                        }`
                      }
                    >
                      {page.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-line mt-auto flex items-center justify-between border-t pt-4">
              {sibling ? (
                <NavLink
                  to={sibling.basePath}
                  onClick={close}
                  className="text-ink-secondary text-micro tracking-wide uppercase no-underline"
                >
                  {sibling.name}
                </NavLink>
              ) : (
                <span />
              )}
              <ThemeToggle />
            </div>
          </Container>
        </div>
      ) : null}
    </>
  );
}
