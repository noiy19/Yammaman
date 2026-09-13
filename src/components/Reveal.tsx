import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Reveal — the entrance animation, from the `animate-entrance` skill.
 *
 * WHY THIS EXISTS
 * The reference's entrance motion is Framer-runtime JS, so a rebuild has to
 * re-create it: on load (or on first scroll-in) each primitive fades in AND
 * moves — rise 26px with a slight scale — staggered so they arrive one after
 * another rather than snapping in as a block. The skill's defaults are used
 * verbatim: 0.7s, cubic-bezier(0.22, 1, 0.36, 1), 0.15s stagger, an
 * IntersectionObserver at threshold 0.1 with a -40px bottom margin.
 *
 * WHY A COMPONENT AND NOT A GLOBAL SCRIPT
 * The skill notes this is "the same pattern with a `.visible` class" in
 * React/Vite. A component keeps the stagger local to the primitive that owns it
 * (a nav row staggers its own items, the hero staggers its own three parts)
 * rather than one global list guessing at relationships it cannot see.
 *
 * The settled state is a CLASS, not inline styles: inline `transition` would
 * override any `:hover` transform on the same element afterwards.
 *
 * REDUCED MOTION is honoured twice. The skill's rule is "no opacity flicker, no
 * layout shift" — so this marks the element settled immediately and never
 * observes it. The base stylesheet also clamps transition durations, which
 * covers anything that slips through.
 */
export function Reveal({
  children,
  /** Stagger in seconds. The skill caps the whole run at ~0.6s. */
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setVisible(true);
          // One shot: an entrance is not a scroll-linked effect, and leaving the
          // observer attached would re-hide the element on scroll-away.
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={delay ? ({ '--reveal-delay': `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
