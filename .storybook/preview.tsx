import type { Decorator, Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { CommerceProvider } from '../src/commerce/CommerceProvider';
import { applyTheme, type Theme } from '../src/theme/useTheme';
import '../src/styles/index.css';

/**
 * Router decorator.
 *
 * Blocks use <Link>, so any story that renders one needs a router in scope.
 * Using MemoryRouter (not the real one) keeps stories from touching the address
 * bar and lets each story set its own entry path.
 */
const withRouter: Decorator = (Story, context) => (
  <MemoryRouter initialEntries={[context.parameters.entryPath ?? '/']}>
    <Story />
  </MemoryRouter>
);

/**
 * Theme decorator.
 *
 * The theme is a TOOLBAR global, not a story-level arg, because it is a
 * property of the token layer rather than of any component. Toggling it here
 * re-values every token at once — which is the only way to see whether the
 * brand kit actually holds up in dark, and the only way the contrast gate gets
 * a dark-theme input.
 *
 * It writes the same attribute the runtime writes, so what you see in Storybook
 * is what ships.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme ?? 'light') as Theme;
  applyTheme(theme);
  return (
    <div className="bg-surface text-ink">
      <Story />
    </div>
  );
};

/**
 * Commerce decorator.
 *
 * Explicit rather than implicit: blocks that read the catalogue fall back to the
 * context default, but wiring it here states plainly that STORIES RUN AGAINST
 * FIXTURES. A reviewer looking at a product grid should never be unsure whether
 * they are seeing real engine data.
 */
const withCommerce: Decorator = (Story) => (
  <CommerceProvider>
    <Story />
  </CommerceProvider>
);

const preview: Preview = {
  decorators: [withTheme, withCommerce, withRouter],

  globalTypes: {
    theme: {
      description: 'EVA / brand-kit theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'EVA 00 — light' },
          { value: 'dark', title: 'EVA 01 — dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'light',
  },

  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Fail the story on an accessibility violation rather than logging it.
      // A warning nobody reads is not a gate.
      test: 'error',
    },
    backgrounds: { disable: true },
  },
};

export default preview;
