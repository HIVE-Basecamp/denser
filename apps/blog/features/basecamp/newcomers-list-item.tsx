'use client';

import { useInView } from 'react-intersection-observer';
import { cn } from '@ui/lib/utils';
import CircleReadout from './postcard/circle-readout';
import FlowerReadout from './postcard/flower-readout';
import IdentityStrip from './postcard/identity-strip';
import PostCard from './postcard/post-card';
import { useAccountCreator } from './hooks/use-account-creator';
import { useAccountHistory } from './hooks/use-account-history';
import { useVestsToHivePowerRate } from './hooks/use-vests-rate';
import { buildReadouts, type ReadoutDisplay, type StakeInput } from './lib/readouts';
import {
  DEFAULT_DRAWING_SIZE,
  POST_FLOOR_WIDTH,
  POST_MAX_WIDTH,
  POSTCARD_TIERS,
  type PostcardTier
} from './lib/postcard-sizes';
import { BASECAMP_SIGNALS, type SignalInput, type SignalValue } from './lib/signals';
import { hivePowerFromAmount } from './lib/stake';
import { BASECAMP_POSTCARD_STYLE } from './lib/theme';
import type { Newcomer } from './hooks/use-newcomers';

/**
 * Between the two anchors — the rings flush left, the flower flush right —
 * the post is the one thing that stretches or gives, so a wider feed gives
 * the title more room rather than leaving a gap, and a narrower one takes
 * room from the title rather than folding the row. The row only wraps on a
 * phone, where nothing fits on one line anyway; on a desktop a card that
 * folds its right half onto a second line is a card with a hole in it.
 */
export const POSTCARD_CLASS =
  'my-2 flex flex-wrap items-center justify-between gap-y-2 rounded-2xl border border-white/10 px-3 py-[10px] text-[#E8EDF5] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm transition-colors duration-200 hover:border-[#B79CFF]/40 sm:flex-nowrap';

interface NewcomersListItemProps extends Newcomer {
  /** Shows a follow button. On where the card is a call to act, off in the feed. */
  showFollow?: boolean;
  /** Sizes for the feed's width; the feed measures itself and picks one. */
  tier?: PostcardTier;
}

/**
 * One postcard: a person, the post they wrote, and every reading the card
 * takes of them, in a single band. Three zones — who and what they posted,
 * five drawings, one flower — grouped by proximity and colour rather than by
 * borders, because borders cost height and a feed of these has to scroll.
 *
 * The card does not know what any readout means: lib/readouts.ts decides what
 * is drawn and what is printed.
 */
const NewcomersListItem = ({
  post,
  accountAgeDays,
  account,
  showFollow = false,
  tier = POSTCARD_TIERS.regular
}: NewcomersListItemProps) => {
  // Deferred until the card is near the viewport, so a long feed does not fire
  // a lookup per row up front. ActivityRings asks for the same account under
  // the same query key, so React Query still makes exactly one history request
  // per card and both read from that one result.
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const { patterns, status } = useAccountHistory(post.author, inView);
  const createdBy = useAccountCreator(post.author, inView);
  const vestsToHivePowerRate = useVestsToHivePowerRate();

  const signalInput: SignalInput = {
    account,
    post: {
      replyCount: typeof post.children === 'number' ? post.children : null,
      voteCount: typeof post.stats?.total_votes === 'number' ? post.stats.total_votes : null,
      createdIso: typeof post.created === 'string' ? post.created : null
    },
    chain: { vestsToHivePowerRate },
    nowMs: Date.now()
  };

  const signalValues: Record<string, SignalValue> = {};
  for (const signal of BASECAMP_SIGNALS) {
    signalValues[signal.id] = signal.compute(signalInput);
  }

  // The stake pie wants the three pieces in Hive Power, not the ratios the
  // signals report.
  const own = hivePowerFromAmount(account.vestingSharesAmount, vestsToHivePowerRate);
  const lentOut = hivePowerFromAmount(account.delegatedVestingAmount, vestsToHivePowerRate);
  const stake: StakeInput = {
    kept: own !== null && lentOut !== null ? Math.max(own - lentOut, 0) : null,
    lentOut,
    lentIn: hivePowerFromAmount(account.receivedVestingAmount, vestsToHivePowerRate)
  };

  // An empty history read must not print as a card full of zeroes, so the
  // patterns are only trusted once the read has actually finished.
  const readouts = buildReadouts(
    signalValues,
    status === 'ready' ? patterns : { ...patterns, known: false },
    createdBy,
    stake
  );
  const shown = (display: ReadoutDisplay) => readouts.filter((readout) => readout.display === display);

  return (
    <li ref={ref}>
      <div
        className={cn(POSTCARD_CLASS)}
        style={{ ...BASECAMP_POSTCARD_STYLE, columnGap: tier.zoneGap }}
        data-testid="newcomer-list-item"
        data-postcard-tier={tier.name}
      >
        <div
          className="min-w-0 flex-auto"
          style={{ flexBasis: tier.postMinWidth, minWidth: POST_FLOOR_WIDTH, maxWidth: POST_MAX_WIDTH }}
        >
          <IdentityStrip
            username={post.author}
            reputation={post.author_reputation}
            accountAgeDays={accountAgeDays}
            createdIso={post.created}
            showFollow={showFollow}
            profile={shown('pips')[0]}
          />
          <div className="mt-1.5">
            <PostCard post={post} />
          </div>
        </div>

        <div className="flex shrink-0 items-center" style={{ columnGap: tier.drawingGap }}>
          {shown('circle').map((readout) => (
            <CircleReadout
              key={readout.id}
              readout={readout}
              size={tier.drawings[readout.id] ?? DEFAULT_DRAWING_SIZE}
              boxHeight={tier.hero}
            />
          ))}
        </div>

        <FlowerReadout petals={shown('petal')} core={shown('core')[0]} size={tier.flower} />
      </div>
    </li>
  );
};

export default NewcomersListItem;
