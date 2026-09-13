/**
 * theme.constants.ts — theme names, kept free of React so config can import them.
 *
 * This module exists so that vite.config.ts (which injects the no-flash script
 * into index.html) and the runtime hook share ONE definition of the storage key
 * and the attribute name. When the no-flash snippet was duplicated into
 * index.html by hand, renaming the attribute meant remembering to edit a string
 * inside a <script> tag in an HTML file — the kind of edit that gets missed and
 * then shows up as a white flash for dark-theme visitors only.
 */

export type Theme = 'light' | 'dark';

/**
 * The active-theme attribute. Matches the selector in brand-kit.css AND the
 * attribute @muen/dsh-brand-yammaman switches its wordmark on. All three must
 * agree or the logo and the tokens disagree about the active theme.
 */
export const THEME_ATTRIBUTE = 'data-ds-dark-theme';

export const THEME_STORAGE_KEY = 'yammaman.theme';

/**
 * Runs before first paint, inlined into <head>. Applies the stored theme — or
 * the OS preference on a first visit — so a dark-theme visitor never sees a
 * flash of the light theme.
 *
 * Deliberately written as ES5 with no optional chaining and wrapped in
 * try/catch: it executes before any polyfill, and localStorage throws outright
 * in some privacy modes. A throw here would abort the rest of <head>.
 *
 * FIRST VISIT IS LIGHT, NOT THE OS PREFERENCE. The reference is light-first —
 * one flat light band the whole page — so defaulting to a dark OS would show
 * every first-time visitor something the design never was. The toggle still
 * wins once used; this is only the initial guess.
 */
export const NO_FLASH_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},a=${JSON.stringify(
  THEME_ATTRIBUTE,
)};var s=localStorage.getItem(k);var d=s?s==='dark':false;if(d){document.documentElement.setAttribute(a,'true');}document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
