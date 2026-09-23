'use client';

import { useId, type CSSProperties } from 'react';
import { cn } from '@ui/lib/utils';
import { BASECAMP_VIVID } from '../lib/theme';
import ConfettiBurst, { CONFETTI_CSS, useConfettiBursts } from './first-post-confetti';

/**
 * How far the ring stands outside the card's edge. The card itself does not
 * grow: the words live in the margin around it, so the height cap holds.
 */
export const FIRST_POST_RING_INSET = 14;
/** Enough words to cover the widest feed and the tallest fold, with the rest hidden. */
const WORDS_ACROSS = 14;
const WORDS_DOWN = 4;
/** One trip of a word along its side. */
const CRAWL_ACROSS = '18s';
const CRAWL_DOWN = '7s';

const NEON = BASECAMP_VIVID.pink;
const NEON_GLOW = `0 0 3px ${NEON}, 0 0 9px ${NEON}D9, 0 0 18px ${NEON}80`;
const PREFIX = 'basecamp-first-post';

/**
 * Degrees between one word and the next, so one lap of the longest side runs
 * the full rainbow once. The short sides repeat the same step over fewer
 * words and simply show less of the sweep at a time — same rule everywhere.
 */
const HUE_STEP_DEG = 360 / WORDS_ACROSS;
/** Saturation/lightness for the word rainbow — vivid, but not so light it washes out on the dark feed. */
const HUE_SATURATION = '88%';
const HUE_LIGHTNESS = '66%';

/**
 * A stable 0-359 number from a React id. Two rings mounted at once get two
 * different numbers (their ids differ), so their rainbows start at different
 * points on the wheel — but it is arithmetic on an id React already made
 * identically on the server and the client, never `Math.random()`, so the
 * first paint can never mismatch.
 */
function huePhaseFrom(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

/**
 * The keyframes, rendered once per feed, not once per card. Plain CSS in a
 * style tag rather than a global stylesheet, for the same reason theme.tsx
 * uses literal colours: nothing outside Basecamp can pick it up by accident,
 * and every name below carries the prefix.
 */
export const FirstPostRingStyles = () => (
  <style>{`
.${PREFIX}-word{display:inline-block;color:hsl(calc(var(--i) * ${HUE_STEP_DEG}deg + var(--hue-phase,0deg)),${HUE_SATURATION},${HUE_LIGHTNESS});text-shadow:0 0 3px currentColor,0 0 9px currentColor,0 0 18px currentColor;animation:${PREFIX}-wiggle .8s ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.17s)}
.${PREFIX}-track{animation:${PREFIX}-crawl var(--t) linear infinite;animation-direction:var(--dir,normal)}
.${PREFIX}-neon{animation:${PREFIX}-flicker 3.2s linear infinite}
@keyframes ${PREFIX}-wiggle{from{transform:rotate(-9deg) translateY(-1px)}to{transform:rotate(9deg) translateY(1px)}}
@keyframes ${PREFIX}-crawl{from{transform:translate(0,0)}to{transform:translate(var(--dx,0),var(--dy,0))}}
@keyframes ${PREFIX}-flicker{0%,18%,22%,25%,53%,57%,100%{opacity:1}20%,24%,55%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.${PREFIX}-word,.${PREFIX}-track,.${PREFIX}-neon{animation:none}.${PREFIX}-word{color:${NEON};text-shadow:${NEON_GLOW}}}
${CONFETTI_CSS}
`}</style>
);

type Side = 'top' | 'right' | 'bottom' | 'left';

/** Inline style that may also carry the ring's own custom properties. */
type RingStyle = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Each side is a strip of the same words, sliding the way that sends the
 * whole ring clockwise: right along the top, down the right, left along the
 * bottom, up the left. The two short sides are written vertically, and the
 * left one is turned around so it reads upward; on that side a slide toward
 * the strip's own start is a slide down the screen, so it runs in reverse
 * like the top and right, and only the bottom runs forward.
 */
const SIDE_STYLE: Record<Side, RingStyle> = {
  top: { '--dx': '-50%', '--dir': 'reverse', '--t': CRAWL_ACROSS },
  bottom: { '--dx': '-50%', '--t': CRAWL_ACROSS },
  right: { '--dy': '-50%', '--dir': 'reverse', '--t': CRAWL_DOWN, writingMode: 'vertical-rl' },
  left: {
    '--dy': '-50%',
    '--dir': 'reverse',
    '--t': CRAWL_DOWN,
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)'
  }
};

const SIDE_CLASS: Record<Side, string> = {
  top: 'left-[14px] right-[14px] top-0 h-[14px]',
  bottom: 'left-[14px] right-[14px] bottom-0 h-[14px]',
  right: 'top-[14px] bottom-[14px] right-0 w-[14px]',
  left: 'top-[14px] bottom-[14px] left-0 w-[14px]'
};

const CORNER_CLASS = ['left-1 top-1', 'right-1 top-1', 'left-1 bottom-1', 'right-1 bottom-1'];

interface WordsProps {
  label: string;
  count: number;
}

/**
 * One copy of the words. The track holds two and slides by exactly one, so
 * the loop has no seam; the trailing gap makes each copy the same length as
 * the next.
 */
const Words = ({ label, count }: WordsProps) => (
  <span className="flex shrink-0 items-center gap-[10px] pe-[10px]">
    {Array.from({ length: count }, (_, index) => {
      const wordStyle: RingStyle = { '--i': index };
      return (
        <span key={index} className="flex items-center gap-[10px]">
          <span
            className={cn(
              PREFIX + '-word',
              'whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.14em]'
            )}
            style={wordStyle}
          >
            {label}
          </span>
          <span className="text-[8px] leading-none">✦</span>
        </span>
      );
    })}
  </span>
);

interface FirstPostRingProps {
  label: string;
}

/**
 * A neon border for a first ever post: the words themselves make the frame,
 * marching around the card and each wiggling on its own, the whole sign
 * flickering the way a tube does. Decorative — the card states the fact once
 * in words for a screen reader; this is the welcome.
 *
 * Each ring runs its own rainbow (via --hue-phase, see huePhaseFrom), keyed
 * off this instance's own React id so two rings never look alike, and holds
 * however many confetti bursts the shared firework scheduler has alight on
 * it right now (useConfettiBursts) — usually several at once.
 */
const FirstPostRing = ({ label }: FirstPostRingProps) => {
  const instanceId = useId();
  const bursts = useConfettiBursts(instanceId);
  const ringStyle: RingStyle = {
    inset: -FIRST_POST_RING_INSET,
    color: NEON,
    textShadow: NEON_GLOW,
    '--hue-phase': `${huePhaseFrom(instanceId)}deg`
  };

  return (
    <div
      className={cn(PREFIX + '-neon', 'pointer-events-none absolute select-none')}
      style={ringStyle}
      aria-hidden="true"
      data-testid="postcard-first-post-ring"
    >
      <div
        className="absolute rounded-2xl"
        style={{
          inset: FIRST_POST_RING_INSET,
          boxShadow: '0 0 0 1px rgba(255, 111, 177, 0.55), 0 0 22px -2px rgba(255, 111, 177, 0.55)'
        }}
      />
      {(Object.keys(SIDE_CLASS) as Side[]).map((side) => (
        <div
          key={side}
          className={cn('absolute flex items-center overflow-hidden', SIDE_CLASS[side])}
          style={SIDE_STYLE[side]}
        >
          <span className={cn(PREFIX + '-track', 'flex h-max w-max shrink-0')}>
            <Words label={label} count={side === 'top' || side === 'bottom' ? WORDS_ACROSS : WORDS_DOWN} />
            <Words label={label} count={side === 'top' || side === 'bottom' ? WORDS_ACROSS : WORDS_DOWN} />
          </span>
        </div>
      ))}
      {CORNER_CLASS.map((corner) => (
        <span
          key={corner}
          className={cn('absolute h-1.5 w-1.5 rounded-full', corner)}
          style={{ backgroundColor: NEON, boxShadow: NEON_GLOW }}
        />
      ))}
      {bursts.map((burst) => (
        <ConfettiBurst key={burst.seed} event={burst} />
      ))}
    </div>
  );
};

export default FirstPostRing;
