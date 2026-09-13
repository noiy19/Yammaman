import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Flat ESLint config.
 *
 * Scope note: ESLint here covers correctness — unused code, hook dependency
 * mistakes, accidentally-implied globals. It deliberately does NOT try to be the
 * design gate. Tokens, contrast, content shape and the Storybook contract are
 * enforced by the scripts in scripts/, because those are checks that need to
 * resolve the token graph and cross-reference documents, which lint rules cannot
 * see. Two tools, two jobs, no overlap.
 */
export default tseslint.config(
  {
    // KEEP THIS IN SYNC WITH .gitignore.
    //
    // ESLint's flat-config ignores are independent of .gitignore, so a directory
    // that Git happily ignores can still be linted. The failure is spectacular
    // rather than subtle: a stray `node_modules` backup produced 16,913 lint
    // errors, which reads as "the whole codebase is broken" rather than "there is
    // a backup directory". `scripts/publish-to-github.sh` carries a matching
    // file-count ceiling for the same class of mistake.
    ignores: [
      'dist',
      'storybook-static',
      'node_modules',
      '.toolchain',
      // `vercel deploy` writes a build output tree here. It is not source, and
      // linting it produced 1,205 errors from minified bundle code — which reads
      // as "the codebase is broken" rather than "a deploy left a directory
      // behind". Same failure mode as the stray node_modules backup below.
      '.vercel',
      // Generated from the vendored EVA JSON by scripts/gen-eva-tokens.mjs.
      'src/styles/eva.css',
      'design-system',
      // A SEPARATE PACKAGE, not part of this application. It is a DSH brand
      // plugin that runs inside the Mitsumeru harness (browser globals, its own
      // package.json) and is installed into a DSH profile, not bundled here.
      // Linting it against this app's rules reports noise like `window is not
      // defined`. It lives in this repository deliberately — see README.md.
      'yammaman-brand-plugin',
      // Scratch and backup directories. Glob form, because a plain name only
      // matches that exact directory.
      '**/node_modules.*',
      '**/*.bak',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // `_`-prefixed names are the documented "intentionally unused" marker.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // `import type` is enforced by tsconfig's verbatimModuleSyntax, but this
      // catches it earlier and with a clearer message.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  {
    // Scripts run in Node, not the browser.
    files: ['scripts/**/*.mjs', '*.config.*'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
);
