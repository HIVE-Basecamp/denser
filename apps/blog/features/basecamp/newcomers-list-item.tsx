'use client';

import type { CSSProperties } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import CircleReadout from './postcard/circle-readout';
import CommentsButton from './postcard/comments-button';
import FirstPostRing from './postcard/first-post-ring';
import FlowerReadout from './postcard/flower-readout';
import IdentityStrip from './postcard/identity-strip';
import PostCard from './postcard/post-card';
import { useAccountCreator } from './hooks/use-account-creator';
import { useAccountHistory } from './hooks/use-account-history';
import { useVestsToHivePowerRate } from './hooks/use-vests-rate';
import { isFirstEverPost } from './lib/first-post';
import { buildReadouts, type ReadoutDisplay, type StakeInput } from './lib/readouts';
import { DEFAULT_DRAWING_SIZE, POST_MAX_WIDTH, POSTCARD_TIERS, type PostcardTier } from './lib/postcard-sizes';
import { BASECAMP_SIGNALS, type SignalInput, type SignalValue } from './lib/signals';
import { hivePowerFromAmount } from './lib/stake';
import { BASECAMP_POSTCARD_STYLE } from './lib/theme';
import type { Newcomer } from './hooks/use-newcomers';

/**
 * Between the two anchors — the rings flush left, the flower flush right —
 * the post is the one thing that stretches or gives, so a wider feed gives
 * the title more room rather than leaving a gap, and a narrower one takes
 * room from the title rather than folding the row. On a desktop a card that
 * folds its right half onto a second line is a card with a hole in it, so
 * the row holds one line. Only where the feed has measured itself too narrow
 * for even the smallest row does it fold, and then into two full lines: the
 * post and the flower, then the five drawings spread edge to edge.
 */
export const POSTCARD_CLASS =
  'relative my-2 flex flex-wrap items-center justify-between gap-y-2 rounded-2xl border border-white/10 px-3 py-[10px] text-[#E8EDF5] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm transition-colors duration-200 hover:border-[#B79CFF]/40 sm:flex-nowrap';

/**
 * A first ever post wears the neon ring, which stands 14px outside the card
 * on every side. The card keeps its size; the row makes room around it, and
 * the card's own border takes the sign's colour so the two read as one.
 */
const FIRST_POST_CLASS = 'my-7 border-[#FF6FB1]/50 hover:border-[#FF6FB1]/80';

/** The one readout that carries a control: the replies drawing gets the way into the replies. */
const REPLY_MIX_READOUT_ID = 'reply_mix';

/** Stacked, the post shares the first line with the flower and may grow past the usual cap to meet it. */
function postZoneStyle(tier: PostcardTier): CSSProperties {
  if (tier.stacked) return { flexBasis: tier.postMinWidth, minWidth: tier.postFloor };
  return { flexBasis: tier.postMinWidth, minWidth: tier.postFloor, maxWidth: POST_MAX_WIDTH };
}

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
  const { t } = useTranslation('common_blog');
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
  const firstPost = isFirstEverPost(account.postCount, status === 'ready' ? patterns : null);

  return (
    <li ref={ref}>
      <div
        className={cn(POSTCARD_CLASS, tier.stacked && 'sm:flex-wrap', firstPost && FIRST_POST_CLASS)}
        style={{ ...BASECAMP_POSTCARD_STYLE, columnGap: tier.zoneGap }}
        data-testid="newcomer-list-item"
        data-postcard-tier={tier.name}
        data-first-post={firstPost || undefined}
      >
        {firstPost ? (
          <>
            <FirstPostRing label={t('basecamp.card.first_post.label')} />
            <span className="sr-only">{t('basecamp.card.first_post.aria')}</span>
          </>
        ) : null}
        <div className="min-w-0 flex-auto" style={postZoneStyle(tier)}>
          <IdentityStrip
            username={post.author}
            permlink={post.permlink}
            ringsSize={tier.rings}
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

        <div
          className={cn('flex shrink-0 items-center', tier.stacked && 'order-1 w-full justify-between')}
          style={{ columnGap: tier.drawingGap }}
        >
          {shown('circle').map((readout) => (
            <CircleReadout
              key={readout.id}
              readout={readout}
              size={tier.drawings[readout.id] ?? DEFAULT_DRAWING_SIZE}
              boxHeight={tier.hero}
              minColumnWidth={tier.column}
              captionSize={tier.caption}
              // The reply mix says what their replies are made of; the button
              // under it opens the replies themselves. It sits in that
              // column's own dead space, so no other column moves and the
              // card keeps its height.
              action={
                readout.id === REPLY_MIX_READOUT_ID
                  ? (fit) => <CommentsButton account={post.author} fit={fit} />
                  : undefined
              }
            />
          ))}
        </div>

        <FlowerReadout petals={shown('petal')} core={shown('core')[0]} size={tier.flower} />
      </div>
    </li>
  );
};

export default NewcomersListItem;
