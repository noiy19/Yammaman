import type { ReactNode } from 'react';

/**
 * Section — vertical rhythm.
 *
 * `as` lets a content page emit real document structure (section/header/aside)
 * instead of a wall of divs, which is what keeps heading order meaningful for
 * screen readers and for the a11y gate.
 *
 * `space` is the reference's rhythm, measured: most sections sit 50px apart,
 * and only the major breaks open up to 100px. This used to be a single
 * responsive step (64/96px), which made every section equally airy — the
 * reference's page reads as one continuous document partly BECAUSE its
 * sections are not uniformly spaced.
 */
export function Section({
  children,
  as: Tag = 'section',
  tone = 'base',
  space = 'base',
  className = '',
  labelledBy,
}: {
  children: ReactNode;
  as?: 'section' | 'div' | 'header' | 'footer' | 'aside';
  /** `inverted` is the one dark band on an otherwise light page. */
  tone?: 'base' | 'raised' | 'sunken' | 'inverted';
  /** `base` = 50px (the default), `large` = 100px (major breaks only). */
  space?: 'base' | 'large';
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
      className={`${toneClass} ${space === 'large' ? 'py-section-lg' : 'py-section'} ${className}`}
    >
      {children}
    </Tag>
  );
}
