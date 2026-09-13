import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { NO_FLASH_SCRIPT } from './src/theme/theme.constants';

/**
 * Injects the no-flash theme script into <head>.
 *
 * WHY A PLUGIN RATHER THAN A LITERAL IN index.html
 * The snippet has to be inline and synchronous — anything deferred means a
 * flash of the wrong theme. But an inline literal in the HTML is a second copy
 * of the storage key and the attribute name, in a file where nothing typechecks
 * it. This reads the one definition in src/theme/theme.constants.ts and writes
 * it in at build time, so there is exactly one place those strings live.
 *
 * `transformIndexHtml` with `injectTo: 'head-prepend'` puts it ahead of the
 * stylesheet link, which is what makes it run before first paint.
 */
function injectNoFlashScript(): Plugin {
  return {
    name: 'yammaman:inject-no-flash-script',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(
          /<script data-no-flash-theme><\/script>/,
          `<script data-no-flash-theme>${NO_FLASH_SCRIPT}</script>`,
        );
      },
    },
  };
}

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/**
 * THE COLON PROBLEM, part 3 — and this one is not fixable with a PATH shim.
 *
 * This project lives at a path containing a colon:
 *
 *   /Users/noiyamasaki/Desktop/yammaman:website
 *
 * Vite's dev server refuses to serve ANY file whose path contains a colon. It is
 * not a misconfiguration and there is no allow-list entry that fixes it — the
 * check is unconditional on POSIX (vite/dist/node/chunks/config.js):
 *
 *   if ((isWindows && windowsDriveRE.test(filePath) ? filePath.slice(2) : filePath)
 *        .includes(':')) return false;
 *
 * On Windows a leading `C:` is stripped (it is a drive letter); on every other
 * platform ANY colon is treated as a smuggling vector and rejected. So
 * development returns HTTP 403 with the confusing message "The request id
 * <path>/index.html is outside of Vite serving allow list" — while listing that
 * very path as allowed.
 *
 * The only correct fix is to rename the directory. Until that happens, relax the
 * check — but ONLY when the colon is actually present, so the guard stays on for
 * everyone else, and log it so nobody has to rediscover why this branch exists.
 *
 * Scope of the relaxation: `server.fs.strict` is a DEV-SERVER option. It has no
 * effect on `vite build`, whose output is static files served by Vercel. The
 * exposure is a localhost dev server reading files the developer already has.
 */
const pathHasColon = projectRoot.includes(':');

if (pathHasColon) {
  // stderr, not stdout: this must not be mistaken for Vite's normal startup log.
  console.error(
    '\n' +
      '  ⚠  Project path contains a colon: ' +
      projectRoot +
      '\n' +
      '     Vite refuses to serve colon paths, so server.fs.strict is disabled\n' +
      '     for this dev server. Development works; the real fix is to rename the\n' +
      '     directory (see SETUP.md). Scripts also need `source scripts/env.sh`.\n',
  );
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectNoFlashScript()],

  resolve: {
    alias: { '@': srcDir },
  },

  build: {
    // Content documents are static JSON, so the whole storefront is cacheable
    // at the CDN with no content API to be up.
    outDir: 'dist',
    sourcemap: true,
  },

  server: {
    port: 5173,
    fs: {
      // See the note above. `strict: false` only when the path forces it.
      strict: !pathHasColon,
    },
  },
});
