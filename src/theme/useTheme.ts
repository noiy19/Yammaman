/**
 * useTheme.ts — the active theme, applied the way the harness applies it.
 *
 * The brand package (@muen/dsh-brand-yammaman) switches its wordmark on
 * `body[data-ds-dark-theme]`; the token layer in brand-kit.css keys off the same
 * attribute. Those must agree, or the logo and the tokens disagree about which
 * theme is active and one of them becomes invisible — exactly the bug the brand
 * package README documents.
 *
 * It is the ACTIVE theme (an attribute), not `prefers-color-scheme`. Once the
 * visitor chooses, their choice wins, because a site that ignores an explicit
 * toggle is worse than one that ignores the OS.
 *
 * On a FIRST visit the default is LIGHT rather than the OS preference: the
 * reference is light-first (one flat light band the whole page), so deferring to
 * a dark OS would show a first-time visitor a design that never existed. The
 * no-flash script in theme.constants.ts makes the same choice, and the two must
 * agree or the first paint disagrees with the render that follows it.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type Theme,
} from './theme.constants';

export type { Theme };
export { THEME_ATTRIBUTE, THEME_STORAGE_KEY };

function readStoredTheme(): Theme | null {
  // Server-side / test renderer: there is no localStorage. Guarding on `window`
  // rather than relying on try/catch, because a bare `window.matchMedia` below
  // would throw a ReferenceError that no catch block around localStorage covers.
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    // Private mode / storage disabled. Not worth breaking the page over.
    return null;
  }
}

function systemTheme(): Theme {
  // Named for its old role; it is now the first-visit default, and the reference
  // is light-first. Kept as a named function so the call site reads the same.
  return 'light';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // The attribute is value-carrying ('true'), matching the CSS selector and the
  // brand package. Removing it entirely is the light theme.
  if (theme === 'dark') root.setAttribute(THEME_ATTRIBUTE, 'true');
  else root.removeAttribute(THEME_ATTRIBUTE);
  root.style.colorScheme = theme;
}

function persist(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Choosing a theme that does not persist still beats refusing to switch.
  }
}

export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
} {
  const [theme, setThemeState] = useState<Theme>(
    () => readStoredTheme() ?? systemTheme(),
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persist(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      persist(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
