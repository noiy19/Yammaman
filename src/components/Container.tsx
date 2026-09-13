import type { ReactNode } from 'react';

/**
 * Container — the page gutter and max width, in one place.
 *
 * Blocks never set their own horizontal padding. If they did, two blocks on the
 * same page would drift out of alignment at some breakpoint and someone would
 * "fix" it with a magic number. The gutter is `page-gutter` from index.css.
 */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`page-gutter mx-auto w-full max-w-6xl ${className}`}>
      {children}
    </div>
  );
}
