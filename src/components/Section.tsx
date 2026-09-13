import type { ReactNode } from 'react';

/**
 * Section — vertical rhythm.
 *
 * `as` lets a content page emit real document structure (section/header/aside)
 * instead of a wall of divs, which is what keeps heading order meaningful for
 * screen readers and for the a11y gate.
 */
export function Section({
  children,
  as: Tag = 'section',
  tone = 'base',
  className = '',
  labelledBy,
}: {
  children: ReactNode;
  as?: 'section' | 'div' | 'header' | 'footer' | 'aside';
  /** `inverted` is the one dark band on an otherwise light page. */
  tone?: 'base' | 'raised' | 'sunken' | 'inverted';
  className?: string;
  labelledBy?: string;
}) {
  const toneClass =
    tone === 'raised'
      ? 'bg-surface-raised'
      : tone === 'sunken'
        ? 'bg-surface-sunken'
        : tone === 'inverted'
          ? 'bg-surface-inverted text-ink-inverted'
          : 'bg-surface';

  return (
    <Tag
      aria-labelledby={labelledBy}
      className={`${toneClass} py-16 md:py-24 ${className}`}
    >
      {children}
    </Tag>
  );
}
