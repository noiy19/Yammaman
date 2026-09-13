import { useCallback, useEffect, useRef, useState } from 'react';
import { WORDMARK_CANVAS, WORDMARK_LETTERS, type Letter } from './letters';

/**
 * Billiards wordmark — a design prototype, not part of the landing page.
 *
 * Each letter is a billiard ball on a table the size of the mark. Point at one
 * and it flips to white with a hairline edge, then shoves away from the cursor
 * and breaks into its neighbours. Leave it alone for five seconds and the whole
 * set inverts and travels home.
 *
 * WHY REFS AND NOT STATE
 * Sixty frames a second through React would re-render eight components and
 * reconcile a tree per frame, to move eight transforms. So the simulation writes
 * `style.transform` directly on the nodes, and React state is kept for the rare,
 * discrete things — which letters are flipped right now.
 *
 * WHY THE LETTERS DON'T EXPLODE AT REST
 * The mark is hand-drawn and its letters interlock: Y's bounding box overlaps A's,
 * and their circles overlap at home. A collision pass that always resolves would
 * therefore push the wordmark apart the moment it mounted. So a pair is only
 * resolved when at least one of them is MOVING — which is also the physically
 * honest rule, since two things lying still against each other are not colliding,
 * they are resting.
 *
 * This is the piece to revisit before it goes anywhere near the landing page:
 * eight floating letters is a plausible header on a desktop and a mess on a
 * phone, and it has no reduced-motion story yet.
 */

const IDLE_MS = 5000;
/** Energy kept on a cushion bounce. A real table is livelier than it looks. */
const CUSHION = 0.68;
/** Per-frame velocity loss while loose. */
const FRICTION = 0.988;
/** Pull toward home during the return, and the damping that stops it overshooting. */
const HOME_PULL = 0.055;
const HOME_DAMPING = 0.86;
/** Below this speed a letter is considered at rest. */
const REST = 0.25;

type Body = {
  home: { x: number; y: number; w: number; h: number };
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  el: HTMLDivElement | null;
};

export function BilliardsWordmark({ className = '' }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bodies = useRef<Body[]>([]);
  const lastTouch = useRef<number>(0);
  const returning = useRef(false);
  const raf = useRef<number>(0);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  /** Resize → re-derive the scale and each letter's radius, and park everything home. */
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const scale = wrap.clientWidth / WORDMARK_CANVAS.w;
    wrap.style.height = `${WORDMARK_CANVAS.h * scale}px`;
    bodies.current = WORDMARK_LETTERS.map((l) => {
      // a circle that fits inside the letter's shorter side, so interlocking
      // neighbours overlap as little as possible at rest
      const r = (Math.min(l.home.w, l.home.h) * scale) / 2;
      return { home: l.home, x: 0, y: 0, vx: 0, vy: 0, r, el: null };
    });
    bodies.current.forEach((body, i) => {
      void i;
      if (body.el) body.el.style.transform = 'translate3d(0,0,0)';
    });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    let prev = performance.now();

    const step = (now: number) => {
      const dt = Math.min(2.5, (now - prev) / 16.667); // frames, clamped so a stall cannot teleport
      prev = now;
      const list = bodies.current;
      const wrap = wrapRef.current;

      if (wrap) {
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        const idle = performance.now() - lastTouch.current > IDLE_MS;
        // entering the return: invert the whole set as it travels back
        if (idle && !returning.current && lastTouch.current > 0) {
          returning.current = true;
          setFlipped(new Set(WORDMARK_LETTERS.map((_, i) => i)));
        }
        if (!idle && returning.current) returning.current = false;

        for (const b of list) {
          if (returning.current) {
            b.vx += -b.x * HOME_PULL * dt;
            b.vy += -b.y * HOME_PULL * dt;
            b.vx *= HOME_DAMPING ** dt;
            b.vy *= HOME_DAMPING ** dt;
            if (Math.abs(b.x) < 0.4 && Math.abs(b.y) < 0.4 && Math.hypot(b.vx, b.vy) < REST) {
              b.x = 0; b.y = 0; b.vx = 0; b.vy = 0;
            }
          } else {
            b.vx *= FRICTION ** dt;
            b.vy *= FRICTION ** dt;
          }

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // cushions: the table is the wordmark's own box
          const hw = (b.home.w * (W / WORDMARK_CANVAS.w)) / 2;
          const hh = (b.home.h * (H / WORDMARK_CANVAS.h)) / 2;
          const cx = hw - b.r;
          const cy = hh - b.r;
          if (b.x < -cx) { b.x = -cx; b.vx = Math.abs(b.vx) * CUSHION; }
          if (b.x > cx) { b.x = cx; b.vx = -Math.abs(b.vx) * CUSHION; }
          if (b.y < -cy) { b.y = -cy; b.vy = Math.abs(b.vy) * CUSHION; }
          if (b.y > cy) { b.y = cy; b.vy = -Math.abs(b.vy) * CUSHION; }
        }

        // balls against balls — 28 pairs, so the naive pass is the right one
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const c = list[j];
            const ax = a.home.x + a.x + a.home.w / 2;
            const cxx = c.home.x + c.x + c.home.w / 2;
            const ay = a.home.y + a.y + a.home.h / 2;
            const cyy = c.home.y + c.y + c.home.h / 2;
            let dx = cxx - ax;
            let dy = cyy - ay;
            let d = Math.hypot(dx, dy);
            const min = a.r + c.r;
            const moving = Math.hypot(a.vx, a.vy) > REST || Math.hypot(c.vx, c.vy) > REST;
            if (!moving || d >= min) continue;
            if (d === 0) { dx = 1; dy = 0; d = 1; }
            const nx = dx / d;
            const ny = dy / d;
            const push = (min - d) / 2;
            a.x -= nx * push;
            a.y -= ny * push;
            c.x += nx * push;
            c.y += ny * push;
            // equal masses: swap the velocity along the normal
            const va = a.vx * nx + a.vy * ny;
            const vc = c.vx * nx + c.vy * ny;
            if (va - vc > 0) {
              a.vx += (vc - va) * nx;
              a.vy += (vc - va) * ny;
              c.vx += (va - vc) * nx;
              c.vy += (va - vc) * ny;
            }
          }
        }

        for (const b of list) {
          if (b.el) b.el.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0)`;
        }

        const settled = list.every((b) => b.x === 0 && b.y === 0);
        if (returning.current && settled) {
          returning.current = false;
          setFlipped(new Set());
        }
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  /** The break: a shove away from the cursor, plus a flick of the ball's own spin. */
  const shove = (i: number, ev: React.PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    const b = bodies.current[i];
    if (!wrap || !b) return;
    lastTouch.current = performance.now();
    returning.current = false;
    const rect = wrap.getBoundingClientRect();
    const scale = rect.width / WORDMARK_CANVAS.w;
    const px = (ev.clientX - rect.left) / scale;
    const py = (ev.clientY - rect.top) / scale;
    const cx = b.home.x + b.home.w / 2;
    const cy = b.home.y + b.home.h / 2;
    let dx = cx - px;
    let dy = cy - py;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const power = 26;
    b.vx += dx * power;
    b.vy += dy * power;
    setFlipped((prev) => new Set(prev).add(i));
    lastTouch.current = performance.now();
  };

  const rest = (i: number) => {
    lastTouch.current = performance.now();
    setFlipped((prev) => {
      const next = new Set(prev);
      // keep it flipped while the pointer is on it; the return clears the rest
      next.add(i);
      return next;
    });
  };

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto w-full select-none ${className}`}
      style={{ aspectRatio: `${WORDMARK_CANVAS.w} / ${WORDMARK_CANVAS.h}` }}
      data-testid="billiards-wordmark"
    >
      {WORDMARK_LETTERS.map((l, i) => (
        <div
          key={`${l.char}-${i}`}
          ref={(el) => {
            if (bodies.current[i]) bodies.current[i].el = el;
          }}
          className="absolute"
          style={{
            left: `${(l.home.x / WORDMARK_CANVAS.w) * 100}%`,
            top: `${(l.home.y / WORDMARK_CANVAS.h) * 100}%`,
            width: `${(l.home.w / WORDMARK_CANVAS.w) * 100}%`,
            height: `${(l.home.h / WORDMARK_CANVAS.h) * 100}%`,
            willChange: 'transform',
          }}
          onPointerEnter={(ev) => shove(i, ev)}
          onPointerLeave={() => rest(i)}
        >
          <LetterFace letter={l} flipped={flipped.has(i)} />
        </div>
      ))}
    </div>
  );
}

/**
 * Two faces, so the ball can turn over: a solid one and an outlined one. The back
 * is pre-rotated, otherwise its glyph reads mirrored once the card flips.
 */
function LetterFace({ letter, flipped }: { letter: Letter; flipped: boolean }) {
  const Shape = () =>
    letter.shape.kind === 'polygon' ? (
      <polygon points={letter.shape.data} />
    ) : (
      <path d={letter.shape.data} />
    );
  return (
    <div
      className="h-full w-full transition-transform duration-500 ease-out"
      style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
    >
      <svg viewBox={letter.viewBox} className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: 'hidden' }} aria-hidden="true">
        <g className="fill-ink">
          <Shape />
        </g>
      </svg>
      <svg
        viewBox={letter.viewBox}
        className="absolute inset-0 h-full w-full"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        aria-hidden="true"
      >
        <g className="fill-surface stroke-ink" strokeWidth={10} strokeLinejoin="round">
          <Shape />
        </g>
      </svg>
      <span className="sr-only">{letter.char}</span>
    </div>
  );
}
