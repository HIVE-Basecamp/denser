'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import RendererContainer from '@/blog/features/post-rendering/rendererContainer';
import { BASECAMP_MUTED } from '../../lib/theme';

/**
 * How tall the post stands before it is folded, in pixels.
 *
 * Tall enough that most first posts are read whole without touching anything,
 * short enough that a long one does not push the buttons off the screen. A
 * folded post is still scrollable inside its own box, so nothing is hidden —
 * it is only kept from taking the whole page.
 */
const FOLDED_HEIGHT = 340;

export interface PostReaderProps {
  account: string;
  permlink: string;
  title: string;
  body: string;
}

/**
 * The post itself, inside the game.
 *
 * Bryan, 2026-09-19: "if i want to choose any of these templates, it means i
 * have not read the post. if i click the post to read it takes me out of
 * basecamp."
 *
 * That was the whole friction. The game asked for a judgement and offered a
 * reply, and the one thing both depend on — the words the person actually
 * wrote — was a link that threw you out of Basecamp and lost your place in
 * the queue. Sending somebody away to fetch the evidence and hoping they come
 * back is not a game, it is a detour.
 *
 * So the post is drawn here, with the site's own renderer, exactly as it is
 * drawn anywhere else: images, links and formatting included. It sits ABOVE
 * the buttons, because reading comes before deciding, and it stays on screen
 * while the reply box is open lower down — scroll up mid-reply and the post
 * is still there to quote from.
 *
 * Nothing is fetched for this. The post was already read to draw the card;
 * its body was simply never put on the screen.
 */
const PostReader = ({ account, permlink, title, body }: PostReaderProps) => {
  const { t } = useTranslation('common_blog');
  const [open, setOpen] = useState(false);

  // A different post on the slab folds the reader back up, so a long one that
  // was unfolded does not leave the next person's post opening halfway down.
  useEffect(() => setOpen(false), [account, permlink]);

  const k = 'basecamp.games.newbie_or_not';

  return (
    <div className="flex flex-col gap-2" data-testid="newbie-post-reader">
      {title ? <h3 className="text-[15px] font-bold leading-snug text-[#E8EDF5]">{title}</h3> : null}

      <div
        className="overflow-y-auto rounded-xl border border-white/10 bg-black/25 px-3 py-2"
        style={open ? undefined : { maxHeight: FOLDED_HEIGHT }}
        data-testid="newbie-post-body"
      >
        <RendererContainer
          body={body}
          author={account}
          permlink={permlink}
          mainPost
          className="prose prose-sm max-w-none text-[13px] leading-relaxed text-[#D6DEEA]"
          dataTestid="newbie-post-rendered"
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        className={cn(
          BASECAMP_MUTED,
          'self-start text-[12px] underline-offset-2 hover:text-[#E8EDF5] hover:underline'
        )}
        data-testid="newbie-post-fold"
      >
        {t(open ? `${k}.reader.fold` : `${k}.reader.unfold`)}
      </button>
    </div>
  );
};

export default PostReader;
