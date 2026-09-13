import { useTheme } from '../theme/useTheme';

/**
 * ThemeToggle — the only control that changes a token's value at runtime.
 *
 * Labelled with the ACTION, not the state ("Switch to dark theme", not "Dark").
 * A toggle whose label describes the current state is ambiguous to anyone using
 * a screen reader, who cannot see which way the switch is thrown.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="border-line text-ink-secondary hover:bg-hover hover:text-ink rounded-md border px-3 py-1.5 font-sans text-xs tracking-wide uppercase transition-colors"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
