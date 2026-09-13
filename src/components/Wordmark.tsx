import { useCallback, useEffect, useRef, useState } from 'react';
import { WORDMARK_CANVAS, WORDMARK_LETTERS, type Letter } from './wordmarkLetters';

/**
 * The wordmark — the eight letters of YAMAMMAN, each one an object.
 *
 * It exists as eight letters rather than one SVG because the source artwork was
 * drawn that way, which is the only reason any of this is possible. The letters
 * carry their own tight viewBoxes and their places in the original composition.
 *
 * ON ENTRANCE the letters arrive one after another — fade, rise, and settle — on
 * the same curve and stagger the rest of the page uses. The settled state is a
 * class in CSS, not an inline style, so a reduced-motion visitor never sees a
 * hidden frame even if the script is slow.
 *
 * ON POINTING at a letter it turns a full 360° on its own axis, arriving white
 * with a hairline drawn INSIDE the letterform; point again and it turns back to
 * black. As it turns it lifts a little and settles back.
 *
 * Only the letter pointed at moves. An earlier version was a real billiard table
 * — the turn pushed its neighbours, they collided with the ones beyond, and the
 * wordmark came apart and reassembled. It was too much: a wordmark that scrambles
 * is a wordmark nobody reads.
 *
 * WHY THE COLOUR CHANGES AT THE HALF-TURN. A 360° rotation ends exactly where it
 * began, so the face the viewer sees at rest is always the same one. Swapping the
 * fill the moment the pointer arrives would show the change on a letter still
 * facing you. Instead it changes at 42% of the turn, while the letter is edge-on
 * and its back is toward the viewer: the swap is invisible, and the rest of the
 * turn carries the new colour round to the front.
 */

const FLIP_MS = 900;
const LIFT_MS = 300;
const DROP_MS = 520;
/** Lift height as a fraction of the wordmark, so it scales with the type. */
const LIFT = 0.022;
/** Per-letter beat on entrance. Eight letters, so the last lands at 0.49s. */
const STAGGER_MS = 70;

export function Wordmark({ className = '' }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastFlip = useRef<number[]>(WORDMARK_LETTERS.map(() => 0));
  const timers = useRef<number[]>(WORDMARK_LETTERS.map(() => 0));
  /** Full turns per letter. The rotation applied is turns × 360°. */
  const [turns, setTurns] = useState<number[]>(() => WORDMARK_LETTERS.map(() => 0));
  const [white, setWhite] = useState<boolean[]>(() => WORDMARK_LETTERS.map(() => false));
  const [lifted, setLifted] = useState<boolean[]>(() => WORDMARK_LETTERS.map(() => false));
  const [liftPx, setLiftPx] = useState(8);
  const [entered, setEntered] = useState(false);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.style.height = `${(WORDMARK_CANVAS.h / WORDMARK_CANVAS.w) * wrap.clientWidth}px`;
    setLiftPx(Math.round(wrap.clientHeight * LIFT));
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // one frame, so the start state is painted before the transition begins
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  /**
   * One point does two things to ONE letter: it turns it, and it lifts it. The
   * colour lands at the turn's edge-on point; the letter drops back after the
   * lift. The debounce is still needed because the lift moves the letter under
   * the cursor, so the pointer can leave and re-enter it mid-hop.
   */
  const hit = (i: number) => {
    const now = performance.now();
    if (now - lastFlip.current[i] < FLIP_MS) return;
    lastFlip.current[i] = now;

    setTurns((prev) => prev.map((t, k) => (k === i ? t + 1 : t)));
    setLifted((prev) => prev.map((l, k) => (k === i ? true : l)));

    window.setTimeout(() => {
      setWhite((prev) => prev.map((w, k) => (k === i ? !w : w)));
    }, FLIP_MS * 0.42);

    window.clearTimeout(timers.current[i]);
    timers.current[i] = window.setTimeout(() => {
      setLifted((prev) => prev.map((l, k) => (k === i ? false : l)));
    }, LIFT_MS + 120);
  };

  return (
    <div
      ref={wrapRef}
      // NO width here. The caller owns it: `w-full` on this box resolves to
      // nothing when its parent is shrink-to-fit, which is exactly what the
      // hero's flex <h1> is — the wordmark measured 0×0 below the md breakpoint.
      className={`relative select-none ${className}`}
      style={{ aspectRatio: `${WORDMARK_CANVAS.w} / ${WORDMARK_CANVAS.h}` }}
      data-testid="wordmark"
    >
      {WORDMARK_LETTERS.map((l, i) => (
        <div
          key={`${l.char}-${i}`}
          className={`wordmark-letter absolute ${entered ? 'wordmark-letter-in' : ''}`}
          style={{
            left: `${(l.home.x / WORDMARK_CANVAS.w) * 100}%`,
            top: `${(l.home.y / WORDMARK_CANVAS.h) * 100}%`,
            width: `${(l.home.w / WORDMARK_CANVAS.w) * 100}%`,
            height: `${(l.home.h / WORDMARK_CANVAS.h) * 100}%`,
            // the beat each letter arrives on, read by the transition above
            ['--letter-delay' as string]: `${(i * STAGGER_MS) / 1000}s`,
          }}
        >
          <div
            className="h-full w-full cursor-pointer"
            onPointerEnter={() => hit(i)}
          >
            {/*
              Two nested transforms, deliberately: the lift is a translate on this
              box and the turn is a rotate on the one inside. Composed on a single
              element the two transitions would fight for the transform property,
              and the rotation's timing would be dragged around by the lift's.
            */}
            <div
              className="h-full w-full"
              style={{
                transform: `translateY(${lifted[i] ? -liftPx : 0}px)`,
                transition: lifted[i]
                  ? `transform ${LIFT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                  : `transform ${DROP_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
              }}
            >
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
                // TWICE the intended line, because the clip below keeps only the
                // inner half of it. A stroke is centred on its path, so clipping
                // to the shape leaves half the width visible: strokeWidth 1 drew a
                // 0.5px rule, which antialiased to grey and stepped along every
                // diagonal. 2 gives the 1px inside border that was asked for.
                strokeWidth={2}
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
