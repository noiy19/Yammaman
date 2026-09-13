/**
 * useTheme.ts — the active theme, applied the way the harness applies it.
 *
 * The brand package (@muen/dsh-brand-yammaman) switches its wordmark on
 * `body[data-ds-dark-theme]`; the token layer in brand-kit.css keys off the same
 * attribute. Those must agree, or the logo and the tokens disagree about which
 * theme is active and one of them becomes invisible — exactly the bug the brand
 * package README documents.
 *
 * It is the ACTIVE theme (an attribute), not `prefers-color-scheme`. The OS
 * preference is only the initial guess; once the visitor chooses, their choice
 * wins, because a site that ignores an explicit toggle is worse than one that
 * ignores the OS.
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
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
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
