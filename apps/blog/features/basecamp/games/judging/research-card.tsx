'use client';

import type { MouseEvent } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import NewcomersListItem from '../../newcomers-list-item';
import { useElementWidth } from '../../hooks/use-element-width';
import { postcardTierFor } from '../../lib/postcard-sizes';
import { BASECAMP_MICRO_LABEL } from '../../lib/theme';
import type { SuspectDetail } from './use-suspect';

interface ResearchCardProps {
  detail: SuspectDetail;
}

/**
 * Anything inside the card that leaves the page leaves in a NEW tab.
 *
 * The card is the feed's own component, links and all, and on the feed
 * following a link in place is exactly right. Inside a game it is not: the
 * game goes, the queue is back at the start, and every read the panel made is
 * made again. So the click is caught here rather than the card being given a
 * mode to carry around — the card stays the one component the feed draws.
 *
 * It has to run on the way DOWN. Every link in the card is a Next.js link,
 * which cancels the click itself and routes the page in place; by the time a
 * bubbling handler sees it the navigation is already decided. So this is a
 * capture handler, taking the click before the link does and stopping it there.
 *
 * A modified click is left alone: the browser's own new-tab, new-window and
 * save-as handling is better than anything done here, and a link that already
 * opens its own tab is not opened twice.
 */
function openInNewTab(event: MouseEvent<HTMLDivElement>) {
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) return;
  event.preventDefault();
  event.stopPropagation();
  window.open(href, '_blank', 'noopener,noreferrer');
}

/**
 * The same postcard the feed draws, unchanged, underneath the game.
 *
 * Every readout and every popover a curator already knows, in the place they
 * are about to make a call. Nothing is re-explained and nothing is added: the
 * game's job is to put the card in front of the player, not to interpret it
 * for them (ETHOS.md).
 *
 * The panel is narrower than the feed, so the card has to be told the width it
 * is drawing at or the row squeezes and the username gets clipped — the one
 * thing the card may never do. Same measurement the feed makes for itself
 * (newcomers-list.tsx).
 */
const ResearchCard = ({ detail }: ResearchCardProps) => {
  const { t } = useTranslation('common_blog');
  const { ref, width } = useElementWidth<HTMLUListElement>();

  return (
    <div data-testid="judging-research-card" onClickCapture={openInNewTab}>
      <span className={cn(BASECAMP_MICRO_LABEL)}>{t('basecamp.games.judging.card_heading')}</span>
      <ul className="list-none" ref={ref}>
        <NewcomersListItem
          post={detail.newcomer.post}
          accountAgeDays={detail.newcomer.accountAgeDays}
          account={detail.newcomer.account}
          tier={postcardTierFor(width)}
        />
      </ul>
    </div>
  );
};

export default ResearchCard;
