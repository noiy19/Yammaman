import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fold — the block entrance.
 *
 * WHY THIS REPLACES THE RISE
 * The earlier entrance treated every primitive as an individual: a fade plus a
 * 26px rise with a slight scale, staggered per element. This one treats each
 * BLOCK as a whole — the tagline, the description, the mark, the marquee — and
 * the movement is a different animal: the content starts a full height below an
 * INVISIBLE FOLD and slides up into place, ease-in-out.
 *
 * The fold is never drawn. The wrapper clips (`overflow: hidden`), the content
 * begins at `translateY(100%)`, and because transforms do not affect layout the
 * wrapper's height IS the content's height — so 100% is exactly one block, and
 * the content waits precisely out of sight rather than being parked at some
 * guessed offset.
 *
 * THE MARQUEE FADES INSTEAD (`variant="fade"`). A strip that is already drifting
 * should not also travel: sliding it would fight the motion it exists to show.
 *
 * BIDIRECTIONAL, BY REQUEST. The observer keeps observing rather than
 * disconnecting after the first reveal, so the entrance re-runs on scroll back
 * and forward again. The rootMargin narrows the trigger to a band in the middle
 * of the viewport, which is what stops it flickering while a block sits exactly
 * on the boundary.
 *
 * Reduced motion settles in CSS (the `prefers-reduced-motion` block in
 * index.css), so those users never see a hidden frame even if this script is
 * slow to run — the mistake the first entrance made and the skill forbids.
 */
export function Fold({
  children,
  /** Stagger in seconds. Blocks are large objects, so the step is wider than a primitive stagger. */
  delay = 0,
  /** `rise` slides up from behind the fold; `fade` only changes opacity. */
  variant = 'rise',
  /** Draw the doubled hairline above this block. */
  rule = false,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  variant?: 'rise' | 'fade';
  rule?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      setVisible(true);
      return;
    }

    // Anything on screen at mount reveals regardless of the band. Without this,
    // a block that is visible but sits outside the trigger zone (the header, or a
    // tall block on a short viewport) stays hidden forever — the fold pushes it a
    // full height down and clips it, so it is not merely un-animated, it is gone.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      requestAnimationFrame(() => setVisible(true));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting);
      },
      { threshold: 0.15, rootMargin: '-10% 0px -10% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const state = visible ? 'fold-visible' : '';
  const variantClass = variant === 'fade' ? 'fold-fade' : '';

  return (
    <div ref={ref} className={className}>
      {/*
        The rule sits OUTSIDE the fold on purpose. If it travelled with the
        content it would be part of the reveal; static, it is the edge the block
        rises past — and its own second hairline drawing in from the left is what
        gives the entrance its progress-slider read.
      */}
      {rule ? (
        <div aria-hidden="true" className={`rule-double ${visible ? 'rule-visible' : ''}`} />
      ) : null}

      <div className={`fold ${variantClass} ${state}`}>
        <div
          className="fold-inner"
          style={delay ? ({ transitionDelay: `${delay}s` } as React.CSSProperties) : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
