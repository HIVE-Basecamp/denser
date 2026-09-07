'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { shortAge } from '../lib/short-age';
import { BASECAMP_MUTED } from '../lib/theme';
import Hint from './hint';

/** Often enough that "now" becomes "1m" on time. */
const TICK_MS = 60_000;

interface PostAgeProps {
  createdIso: string;
}

/**
 * How long ago the post went up, in four characters or fewer, beside the
 * name. The name is what matters on that line, so this is the part that
 * gives way; the full date is in the popover. The clock is read after mount,
 * like every relative time here, so the server and the browser never disagree.
 */
const PostAge = ({ createdIso }: PostAgeProps) => {
  const { t } = useTranslation('common_blog');
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const age = nowMs === null ? null : shortAge(createdIso, nowMs);
  if (!age) return null;

  return (
    <Hint
      title={t('basecamp.card.labels.posted')}
      value={new Date(createdIso).toLocaleString()}
      body={t('basecamp.card.hints.posted')}
    >
      <span
        className={cn(BASECAMP_MUTED, 'cursor-default whitespace-nowrap text-[11px] leading-none tabular-nums')}
        data-testid="postcard-post-age"
      >
        <span aria-hidden="true">· </span>
        {t(`basecamp.card.values.age.${age.unit}`, { value: age.value })}
      </span>
    </Hint>
  );
};

export default PostAge;
