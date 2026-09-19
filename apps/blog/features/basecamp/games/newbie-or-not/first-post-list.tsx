'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { useTranslation } from '@/blog/i18n/client';
import { shortAge } from '../../lib/short-age';
import { BASECAMP_MUTED } from '../../lib/theme';
import type { FirstPost } from './use-first-posts';

/** Often enough that "now" becomes "1m" on time, and no oftener. */
const TICK_MS = 60_000;

const ROW =
  'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors border-white/10 bg-white/[0.03] hover:border-[#FF6FB1]/45 hover:bg-[#FF6FB1]/[0.07]';
const ROW_HERE = 'border-[#FF6FB1]/55 bg-[#FF6FB1]/[0.12]';

export interface FirstPostListProps {
  posts: readonly FirstPost[];
  /** Which one is on the slab above, so the list can say "you are here". */
  current: number;
  onPick: (index: number) => void;
  /** True while the game is still reading its way back through the day. */
  stillReading: boolean;
}

/**
 * Every first post of the last day, under the game.
 *
 * The game deals them one at a time, which is the right way to look properly
 * at one person — and the wrong way to decide WHICH person is worth looking
 * at. Bryan, 2026-09-19: "if someone wants to scroll down, they can then
 * scroll down and choose another first post if they want."
 *
 * So the whole window is laid out here and any of it can be jumped to. It is
 * deliberately a list and not a wall of postcards: the point is to choose
 * quickly by who and what, then go back up and read properly.
 *
 * Nothing here is the Basecamp feed. The feed below the page is every new
 * ACCOUNT; this is only the posts that are somebody's first, which is the
 * game's whole subject.
 */
const FirstPostList = ({ posts, current, onPick, stillReading }: FirstPostListProps) => {
  const { t } = useTranslation('common_blog');
  // Read on the client only, and ticking, so an age is never rendered on the
  // server where "now" would be the build's now and not the reader's.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const k = 'basecamp.games.newbie_or_not';

  return (
    <div className="flex flex-col gap-2" data-testid="newbie-first-post-list">
      <div>
        <p className="text-[12px] font-semibold text-[#B9C4D6]">{t(`${k}.list.heading`)}</p>
        <p className={cn(BASECAMP_MUTED, 'text-[11px] leading-snug')}>
          {t(`${k}.list.count`, { count: posts.length })}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {posts.map((post, index) => {
          const age = nowMs === null ? null : shortAge(post.createdIso, nowMs);
          return (
            <li key={`${post.account}/${post.permlink}`}>
              <button
                type="button"
                onClick={() => onPick(index)}
                className={cn(ROW, index === current && ROW_HERE)}
                data-testid="newbie-first-post-row"
                aria-current={index === current ? 'true' : undefined}
              >
                {/* A background image, the way the postcard's own strip draws
                    an avatar: no <img>, so nothing here needs the framework's
                    image rules bent for it. */}
                <span
                  aria-hidden="true"
                  style={{ backgroundImage: `url(${getUserAvatarUrl(post.account, 'small')})` }}
                  className="h-6 w-6 shrink-0 rounded-full bg-white/10 bg-cover bg-center"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-[#E8EDF5]">
                    {post.title || t(`${k}.list.untitled`)}
                  </span>
                  <span className={cn(BASECAMP_MUTED, 'block truncate text-[11px] leading-tight')}>
                    @{post.account}
                    {age ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        {t(`basecamp.card.values.age.${age.unit}`, { value: age.value })}
                      </>
                    ) : null}
                  </span>
                </span>
                {index === current ? (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-[#FF9ECB]">
                    {t(`${k}.list.here`)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {/*
        No "keep looking" button. Reading the day is the game's job, not the
        player's (Bryan, 2026-09-19). This line only says which it is doing.
      */}
      <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')} data-testid="newbie-list-state">
        {t(stillReading ? `${k}.list.still_reading` : `${k}.list.window_end`)}
      </p>
    </div>
  );
};

export default FirstPostList;
