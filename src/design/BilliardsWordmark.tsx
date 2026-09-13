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
const FLIP_MS = 900;
/**
 * Vertical travel only, expressed as a FRACTION of the table's height rather than
 * a pixel count: the letters are sized in percentages, so a fixed pixel bound
 * would be a gentle wobble on a laptop and a lurch on a large screen. X is locked
 * at zero, which is what keeps the mark's horizontal rhythm intact while it moves.
 */
const Y_TRAVEL = 0.055;
const FRICTION = 0.988;
const HOME_PULL = 0.055;
const HOME_DAMPING = 0.80;
const REST = 0.25;
/** How far a turn's pulse reaches, and how hard it pushes at the centre. */
const PULSE_REACH = 520;
const PULSE_POWER = 15;

type Body = {
  home: { x: number; y: number; w: number; h: number };
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  el: HTMLDivElement | null;
};

/** The rendered vertical bound, recomputed on resize. */
let yLimit = 60;

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
    yLimit = wrap.clientHeight * Y_TRAVEL;
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
        const idle = performance.now() - lastTouch.current > IDLE_MS;
        if (idle && !returning.current && lastTouch.current > 0) returning.current = true;
        if (!idle) returning.current = false;

        for (const b of list) {
          if (returning.current) {
            b.vy += -b.y * HOME_PULL * dt;
            b.vy *= HOME_DAMPING ** dt;
            if (Math.abs(b.y) < 0.4 && Math.abs(b.vy) < REST) {
              b.y = 0;
              b.vy = 0;
            }
          } else {
            b.vy *= FRICTION ** dt;
          }
          b.y += b.vy * dt;

          // x is locked at zero: these letters move up and down and nowhere else
          b.x = 0;
          b.vx = 0;

          if (b.y < -yLimit) { b.y = -yLimit; b.vy = Math.abs(b.vy) * 0.2; }
          if (b.y > yLimit) { b.y = yLimit; b.vy = -Math.abs(b.vy) * 0.2; }
        }

        // balls against balls, vertically. Two letters interact when their
        // columns overlap and their bands meet; the push is up or down according
        // to which is above, since there is no longer a horizontal axis to push
        // along.
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const c = list[j];
            // columns must overlap, or they cannot reach each other at all
            const aL = a.home.x;
            const aR = a.home.x + a.home.w;
            const cL = c.home.x;
            const cR = c.home.x + c.home.w;
            if (aR < cL || cR < aL) continue;

            const ay = a.home.y + a.y + a.home.h / 2;
            const cy = c.home.y + c.y + c.home.h / 2;
            const gap = c.y + c.home.y - (a.y + a.home.y);
            const min = (a.home.h + c.home.h) / 2;
            const moving = Math.abs(a.vy) > REST || Math.abs(c.vy) > REST;
            if (!moving || Math.abs(gap) >= min) continue;

            const dir = cy >= ay ? 1 : -1;
            const push = (min - Math.abs(gap)) / 2;
            a.y -= dir * push;
            c.y += dir * push;
            const va = a.vy;
            const vc = c.vy;
            if (dir > 0 && va > vc) {
              a.vy = vc;
              c.vy = va;
            } else if (dir < 0 && va < vc) {
              a.vy = vc;
              c.vy = va;
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
   * Pointing at a letter turns it IN PLACE and nothing else. It does not move:
   * the letter you aimed at is the one thing on the table guaranteed to stay
   * where it is, which is what makes it possible to point at the same one twice.
   *
   * The billiards survives because the turn is a PULSE — it shoves the letters
   * around it outward, and those then collide with others. So the flipped letter
   * is the cue, and the break happens around it rather than to it.
   */
  const hit = (i: number) => {
    const src = bodies.current[i];
    const now = performance.now();
    lastTouch.current = now;
    returning.current = false;
    if (now - lastFlip.current[i] < FLIP_MS) return;
    lastFlip.current[i] = now;

    setTurns((prev) => prev.map((t, k) => (k === i ? t + 1 : t)));
    window.setTimeout(() => {
      setWhite((prev) => prev.map((w, k) => (k === i ? !w : w)));
    }, FLIP_MS * 0.42);

    if (!src) return;
    const sy = src.home.y + src.home.h / 2;
    for (const [k, b] of bodies.current.entries()) {
      if (k === i) continue;
      // only the columns that reach this one, and only vertically
      const aL = src.home.x;
      const aR = src.home.x + src.home.w;
      const bL = b.home.x;
      const bR = b.home.x + b.home.w;
      if (aR < bL - PULSE_REACH || bR < aL - PULSE_REACH) continue;
      const dy = b.home.y + b.home.h / 2 - sy;
      const d = Math.hypot(Math.max(0, Math.max(aL - bR, bL - aR)), dy) || 1;
      if (d > PULSE_REACH) continue;
      const power = PULSE_POWER * (1 - d / PULSE_REACH);
      // up or down according to which side it is on; never sideways
      b.vy += (dy >= 0 ? 1 : -1) * power;
    }
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
          onPointerEnter={() => hit(i)}
        >
          {/* the axis is the letter's own centre, and nothing is drawn on it */}
          <div
            className="h-full w-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${turns[i] * 360}deg)`,
              transition: `transform ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.55, 1)`,
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
