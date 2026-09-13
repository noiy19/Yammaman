import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook is the VISUAL CONTRACT (tech-stack.md).
 *
 * The convention that makes it a contract rather than a gallery:
 *
 *   - exactly one stories file per block, at src/blocks/<Component>.stories.tsx
 *   - each declares `title: 'Blocks/<Type>'` using the SAME type string the
 *     content schema uses
 *
 * `pnpm run gate:storybook-contract` cross-checks the three lists that must
 * agree — the JSON schema (what content may say), the block registry (what code
 * can render), and these stories (what a human has actually looked at). A block
 * type that exists in only two of the three fails CI. That is what stops a
 * client content PR from referencing a block nobody has ever seen rendered.
 *
 * Stories are NOT a duplicate of the schema's fixtures: the fixtures in
 * __fixtures__/storyFixtures.ts are the single source of sample props, and each
 * story renders a real component with them.
 */
const config: StorybookConfig = {
  // No `.mdx` in this glob: there are no docs pages yet, and an unmatched
  // pattern makes Storybook print "No story files found" on every single start
  // — a warning that is always wrong trains people to ignore warnings. Add
  // `'../src/**/*.mdx'` back when the first docs page lands.
  stories: ['../src/**/*.stories.@(ts|tsx)'],

  addons: [
    '@storybook/addon-docs',
    // a11y is an addon AND a gate: contrast and landmark violations surface
    // here before they reach a PR review.
    '@storybook/addon-a11y',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  typescript: {
    // The story files are typechecked by tsconfig.app.json via `pnpm run
    // typecheck`; react-docgen only needs to read prop types.
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
