'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_MICRO_LABEL, BASECAMP_MUTED, BASECAMP_PANEL } from '../../lib/theme';
import {
  findNewbieVerdict,
  saveNewbieVerdict,
  type NewbieChoice,
  type NewbieVerdict
} from '../../lib/newbie-or-not';
import GameNotice from '../judging/game-notice';
import ResearchCard from '../judging/research-card';
import SuspectProfile from '../judging/suspect-profile';
import { useSuspect } from '../judging/use-suspect';
import { useFirstPosts } from './use-first-posts';
import PostReader from './post-reader';
import ThreeWayVerdict from './three-way-verdict';
import WelcomePanel from './welcome-panel';
import FirstPostList from './first-post-list';

/** How few are left before the game goes and asks the feed for more. */
const TOP_UP_AT = 5;

/**
 * Newbie or Not to Be: somebody's very first post, and what you make of it.
 *
 * The other judging games read a history. This one cannot — there is none.
 * Every account in the queue has published exactly one thing, and that one
 * thing is the whole of the evidence. The queue is EXACTLY the posts the feed
 * throws confetti at, and nothing else (Bryan, 2026-09-19). The game is built
 * around that shortage rather than against it:
 *
 * - THREE answers, not two, because "I cannot tell" is honest here far more
 *   often than anywhere else, and a game with only two buttons turns that
 *   into a guess recorded as a judgement.
 * - A WELCOME as well as a verdict. Every other game ends at the accusation;
 *   this one can sit on the one post in somebody's life where a reply changes
 *   whether they stay. Judging without that half would make the game a filter
 *   over people arriving, which is not what Basecamp is for.
 *
 * The postcard and the research links sit underneath, as in the other games,
 * and they will be thin — that is the truth of a first post, not a fault to
 * paper over.
 */
const NewbieOrNotGame = () => {
  const { t } = useTranslation('common_blog');
  const { queue, loaded, loadMore, hasMore } = useFirstPosts();
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<NewbieVerdict | null>(null);

  const post = queue[index] ?? null;
  // The shape the shared research card and profile already speak.
  const { detail, isLoading, isError } = useSuspect(
    post
      ? { account: post.account, permlink: post.permlink, reportedIso: post.createdIso, source: 'feed' }
      : null
  );

  // Storage is read on the client only, for the same reason the queue is.
  useEffect(() => {
    setVerdict(post ? findNewbieVerdict(post.account) : null);
  }, [post]);

  /*
    KEEP READING UNTIL THE DAY IS READ. A first post is a sliver of the feed,
    so this runs many times before even the first one is found.

    There used to be a cap on how many pages it would read by itself, and the
    game then offered a "keep looking" button. That was wrong: Bryan knew
    there were more than five first posts that day, was shown two, and had to
    press a button to be shown four (2026-09-19). Reading the day is the
    game's job, not his. The window itself is the stop — `hasMore` goes false
    the moment the feed walks out past twenty-four hours — so there is a real
    end to reach and nothing to cap.
  */
  useEffect(() => {
    if (index >= queue.length - TOP_UP_AT) loadMore();
  }, [index, queue.length, loadMore]);

  const advance = useCallback(() => setIndex((current) => current + 1), []);

  const decide = useCallback(
    (choice: NewbieChoice, why: string) => {
      if (!post) return;
      saveNewbieVerdict({
        account: post.account,
        permlink: post.permlink,
        verdict: choice,
        why,
        decidedIso: new Date().toISOString()
      });
      advance();
    },
    [post, advance]
  );

  const k = 'basecamp.games.newbie_or_not';

  // NEVER NOTHING. This used to return null while the feed was still being
  // read, which made the game's button look broken: Bryan clicked it and the
  // page did not change (2026-09-19). A screen that is still working says so.
  if (!loaded) {
    return <GameNotice title={t(`${k}.finding_title`)} body={t(`${k}.finding_body`)} />;
  }

  // Nobody yet while the feed still has pages inside the day: that is a wait,
  // not the end of the game, and it must never read as one. The queue asks
  // for the next page itself (the effect above), so this resolves on its own;
  // it used to say "no first posts" here while the day was still being read.
  // The same holds for running off the end of a queue that had somebody.
  if ((queue.length === 0 || !post) && hasMore) {
    return <GameNotice title={t(`${k}.finding_title`)} body={t(`${k}.finding_body`)} />;
  }

  if (queue.length === 0) {
    return <GameNotice title={t(`${k}.empty_title`)} body={t(`${k}.empty_body`)} />;
  }

  if (!post) {
    return (
      <GameNotice
        title={t(`${k}.done_title`)}
        body={t(`${k}.done_body`)}
        action={{ label: t('basecamp.games.judging.start_again'), onClick: () => setIndex(0) }}
      />
    );
  }

  return (
    <div className={cn(BASECAMP_PANEL, 'mt-3 flex flex-col gap-4')} data-testid="newbie-or-not-game">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn(BASECAMP_MUTED, 'text-sm leading-snug')}>{t(`${k}.intro`)}</p>
        <span className={cn(BASECAMP_MICRO_LABEL, 'shrink-0')} data-testid="newbie-position">
          {t('basecamp.games.judging.position', { current: index + 1, total: queue.length })}
        </span>
      </div>

      {/*
        EVERY post here is a first ever post - that is the whole queue - so the
        badge is a statement, not a distinction. It is worth drawing anyway: it
        is the same confetti-pink the feed marks these with, and it is how a
        player knows the game is keeping its name.
      */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="bg-[#FF6FB1]/12 rounded-full border border-[#FF6FB1]/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#FF9ECB]"
          data-testid="newbie-first-post"
        >
          {t(`${k}.first_post_badge`)}
        </span>
      </div>

      <p className={cn(BASECAMP_MUTED, 'text-[11px] leading-snug')} data-testid="newbie-thin">
        {t(`${k}.thin_evidence`)}
      </p>

      {isError || (!isLoading && !detail) ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.judging.gone')}</p>
      ) : null}

      {isLoading ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')}>{t('basecamp.games.judging.loading')}</p>
      ) : null}

      {detail ? (
        <SuspectProfile
          account={post.account}
          reputation={detail.reputation}
          accountAgeDays={detail.newcomer.accountAgeDays}
          postCount={detail.newcomer.account.postCount}
        />
      ) : null}

      {/*
        THE POST, before the buttons. You cannot judge what you have not read,
        and you certainly cannot welcome somebody about it. It used to be a
        link that threw you out of Basecamp and lost your place in the queue
        (Bryan, 2026-09-19).
      */}
      {detail ? (
        <PostReader
          account={post.account}
          permlink={post.permlink}
          title={typeof detail.newcomer.post.title === 'string' ? detail.newcomer.post.title : post.title}
          body={typeof detail.newcomer.post.body === 'string' ? detail.newcomer.post.body : ''}
        />
      ) : null}

      <ThreeWayVerdict account={post.account} existing={verdict} onDecide={decide} onSkip={advance} />

      <div className="h-px bg-white/10" />

      <WelcomePanel account={post.account} permlink={post.permlink} />

      {detail ? <ResearchCard detail={detail} /> : null}

      {/*
        AND THE WHOLE WINDOW UNDERNEATH. Dealing one at a time is the right
        way to look properly at a person and the wrong way to choose WHICH
        person, so the rest of the day's first posts are laid out below and
        any of them can be jumped to (Bryan, 2026-09-19).
      */}
      <div className="h-px bg-white/10" />

      <FirstPostList posts={queue} current={index} onPick={setIndex} stillReading={hasMore} />
    </div>
  );
};

export default NewbieOrNotGame;
