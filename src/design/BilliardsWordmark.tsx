import { useCallback, useEffect, useRef, useState } from 'react';
import { WORDMARK_CANVAS, WORDMARK_LETTERS, type Letter } from './letters';

/**
 * Billiards wordmark — a design prototype, not part of the landing page.
 *
 * Each letter is a billiard ball on a table the size of the mark. Point at one
 * and it turns a full 360° on its own axis, arriving white with a hairline drawn
 * INSIDE the letterform; point at it again and it turns back to black. The turn
 * also shoves it away from the cursor, and it breaks into its neighbours. Leave
 * the set alone for five seconds and it travels home.
 *
 * WHY THE COLOUR CHANGES AT THE HALF-TURN
 * A 360° rotation ends exactly where it began, so the face the viewer sees at rest
 * is always the same one. Swapping the fill the moment the pointer arrives would
 * show the change on a letter still facing you. Instead the colour changes at
 * 180°, while the letter is edge-on and its back is toward the viewer: the swap is
 * invisible, and the second half of the turn carries the new colour round to the
 * front. Both faces are drawn in the current colour, so the handover is seamless.
 *
 * WHY REFS AND NOT STATE
 * Sixty frames a second through React would re-render eight components per frame
 * to move eight transforms. The simulation writes `style.transform` directly;
 * state is kept for the discrete things — the turn counter, and whether a letter
 * is white.
 *
 * WHY THE LETTERS DON'T EXPLODE AT REST
 * The mark is hand-drawn and its letters interlock, so their collision circles
 * overlap at home. A pair is only resolved when at least one of them is MOVING —
 * which is also the honest rule, since two things lying still against each other
 * are not colliding, they are resting.
 */

const IDLE_MS = 5000;
const FLIP_MS = 700;
const CUSHION = 0.68;
const FRICTION = 0.988;
const HOME_PULL = 0.055;
const HOME_DAMPING = 0.86;
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
  const lastTouch = useRef(0);
  const returning = useRef(false);
  const raf = useRef(0);
  /** Full turns per letter. The rotation applied is turns × 360°. */
  const [turns, setTurns] = useState<number[]>(() => WORDMARK_LETTERS.map(() => 0));
  /**
   * When each letter was last turned. The letter is shoved away by the very
   * interaction that flips it, so the pointer leaves and re-enters it repeatedly
   * as it travels — which without this would fire a dozen flips per approach and
   * leave the rotation chasing itself forever. One arrival, one turn.
   */
  const lastFlip = useRef<number[]>(WORDMARK_LETTERS.map(() => 0));
  const [white, setWhite] = useState<boolean[]>(() => WORDMARK_LETTERS.map(() => false));

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const scale = wrap.clientWidth / WORDMARK_CANVAS.w;
    wrap.style.height = `${WORDMARK_CANVAS.h * scale}px`;
    bodies.current = WORDMARK_LETTERS.map((l) => ({
      home: l.home,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: (Math.min(l.home.w, l.home.h) * scale) / 2,
      el: null,
    }));
    bodies.current.forEach((body) => {
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
      const dt = Math.min(2.5, (now - prev) / 16.667);
      prev = now;
      const list = bodies.current;
      const wrap = wrapRef.current;
      if (wrap) {
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        const idle = performance.now() - lastTouch.current > IDLE_MS;
        if (idle && !returning.current && lastTouch.current > 0) returning.current = true;
        if (!idle) returning.current = false;

        for (const b of list) {
          if (returning.current) {
            b.vx += -b.x * HOME_PULL * dt;
            b.vy += -b.y * HOME_PULL * dt;
            b.vx *= HOME_DAMPING ** dt;
            b.vy *= HOME_DAMPING ** dt;
            if (Math.abs(b.x) < 0.4 && Math.abs(b.y) < 0.4 && Math.hypot(b.vx, b.vy) < REST) {
              b.x = 0;
              b.y = 0;
              b.vx = 0;
              b.vy = 0;
            }
          } else {
            b.vx *= FRICTION ** dt;
            b.vy *= FRICTION ** dt;
          }
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // cushions are the mark's own box
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
            const cx2 = c.home.x + c.x + c.home.w / 2;
            const ay = a.home.y + a.y + a.home.h / 2;
            const cy2 = c.home.y + c.y + c.home.h / 2;
            let dx = cx2 - ax;
            let dy = cy2 - ay;
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
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  /**
   * One point at a letter does two things: it spins the ball a full turn, and it
   * shoves it. The colour lands at the half-turn, while the letter faces away.
   */
  const hit = (i: number, ev: React.PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    const b = bodies.current[i];
    const now = performance.now();
    lastTouch.current = now;
    returning.current = false;
    if (now - lastFlip.current[i] < FLIP_MS) return;
    lastFlip.current[i] = now;
    setTurns((prev) => prev.map((t, k) => (k === i ? t + 1 : t)));
    window.setTimeout(() => {
      setWhite((prev) => prev.map((w, k) => (k === i ? !w : w)));
    }, FLIP_MS / 2);

    if (!wrap || !b) return;
    const rect = wrap.getBoundingClientRect();
    const scale = rect.width / WORDMARK_CANVAS.w;
    const px = (ev.clientX - rect.left) / scale;
    const py = (ev.clientY - rect.top) / scale;
    let dx = b.home.x + b.home.w / 2 - px;
    let dy = b.home.y + b.home.h / 2 - py;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const power = 26;
    b.vx += dx * power;
    b.vy += dy * power;
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
          className="absolute cursor-pointer"
          style={{
            left: `${(l.home.x / WORDMARK_CANVAS.w) * 100}%`,
            top: `${(l.home.y / WORDMARK_CANVAS.h) * 100}%`,
            width: `${(l.home.w / WORDMARK_CANVAS.w) * 100}%`,
            height: `${(l.home.h / WORDMARK_CANVAS.h) * 100}%`,
            willChange: 'transform',
          }}
          onPointerEnter={(ev) => hit(i, ev)}
        >
          {/* the axis is the letter's own centre, and nothing is drawn on it */}
          <div
            className="h-full w-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${turns[i] * 360}deg)`,
              transition: `transform ${FLIP_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
            }}
          >
            <Face letter={l} white={white[i]} index={i} />
            <Face letter={l} white={white[i]} index={i} back />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * One face of the letter. The white state draws a 1px rule INSIDE the letterform:
 * a stroke is centred on its path, so half of it would fall outside the shape —
 * except that clipping the stroke to the shape keeps only the inner half, and
 * `non-scaling-stroke` then makes "1px" mean one pixel on screen rather than one
 * unit of the mark's 1745-unit coordinate space.
 */
function Face({
  letter,
  white,
  index,
  back = false,
}: {
  letter: Letter;
  white: boolean;
  index: number;
  back?: boolean;
}) {
  const Shape = () =>
    letter.shape.kind === 'polygon' ? (
      <polygon points={letter.shape.data} />
    ) : (
      <path d={letter.shape.data} />
    );
  const clipId = `letter-clip-${index}`;

  return (
    <div
      className="absolute inset-0"
      style={{ backfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : undefined }}
      aria-hidden="true"
    >
      <svg viewBox={letter.viewBox} className="h-full w-full">
        {white ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <Shape />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <g
                className="fill-surface stroke-ink"
                strokeWidth={1}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              >
                <Shape />
              </g>
            </g>
          </>
        ) : (
          <g className="fill-ink">
            <Shape />
          </g>
        )}
      </svg>
    </div>
  );
}
