'use client';

import { Link } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import HourlyClock from './hourly-clock';
import { BASECAMP_LINK, BASECAMP_MUTED } from './lib/theme';
import type { CommentPatterns } from './lib/patterns';
import type { HistoryStatus } from './hooks/use-account-history';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

interface ReadoutTile {
  id: string;
  labelKey: string;
  value: number | null;
  /** How the number is written once it is known. */
  format: 'percent' | 'count';
}

interface CardReadoutsProps {
  patterns: CommentPatterns;
  createdBy: string | null;
  status: HistoryStatus;
}

function formatTile(t: TranslateFn, tile: ReadoutTile): string {
  if (tile.value === null || !Number.isFinite(tile.value)) return t('basecamp.signals.value_unknown');
  return tile.format === 'percent'
    ? t('basecamp.signals.units.percent', { value: tile.value })
    : t('basecamp.signals.units.count', { value: tile.value });
}

/**
 * The second row of a postcard: how the account writes, when it writes, and who
 * brought it here. Everything shown is derived from the single history read the
 * card already makes — no readout here costs an extra request.
 *
 * Every tile is a plain number. Nothing is coloured by whether the number is
 * flattering, and no tile is ever labelled good or bad: the card presents, the
 * reader decides. That is deliberate and should survive redesign.
 */
const CardReadouts = ({ patterns, createdBy, status }: CardReadoutsProps) => {
  const { t } = useTranslation('common_blog');

  // Nothing to draw until the lookup has run. An empty strip is better than a
  // row of dashes on every card in a feed that is still loading.
  if (status === 'idle') return null;

  const ready = status === 'ready' && patterns.known;

  const tiles: ReadoutTile[] = [
    {
      id: 'reply_targets',
      labelKey: 'basecamp.patterns.labels.reply_targets',
      value: ready ? patterns.distinctReplyTargets : null,
      format: 'count'
    },
    {
      id: 'replies_7d',
      labelKey: 'basecamp.patterns.labels.replies_7d',
      value: ready ? patterns.replyCount7d : null,
      format: 'count'
    },
    {
      id: 'posts_7d',
      labelKey: 'basecamp.patterns.labels.posts_7d',
      value: ready ? patterns.postCount7d : null,
      format: 'count'
    },
    {
      id: 'repeated_text',
      labelKey: 'basecamp.patterns.labels.repeated_text',
      value: ready ? patterns.duplicatePercent : null,
      format: 'percent'
    },
    {
      id: 'bot_commands',
      labelKey: 'basecamp.patterns.labels.bot_commands',
      value: ready ? patterns.botCommandPercent : null,
      format: 'percent'
    },
    {
      id: 'self_replies',
      labelKey: 'basecamp.patterns.labels.self_replies',
      value: ready ? patterns.selfReplyPercent : null,
      format: 'percent'
    },
    {
      id: 'self_votes',
      labelKey: 'basecamp.patterns.labels.self_votes',
      value: ready ? patterns.selfVotePercent : null,
      format: 'percent'
    }
  ];

  return (
    <div
      className="mt-2.5 flex items-center gap-3 border-t border-white/[0.07] pt-2.5"
      data-testid="newcomer-readouts"
    >
      <HourlyClock
        hourlyCounts={patterns.hourlyCounts}
        activeHourCount={patterns.activeHourCount}
        known={ready}
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {tiles.map((tile) => {
          const isKnown = tile.value !== null && Number.isFinite(tile.value);
          return (
            <div
              key={tile.id}
              className={cn(
                // A shared minimum width so the tiles line up in even columns
                // however many rows they wrap onto — a ragged strip reads as a
                // list of leftovers rather than a set of readings.
                'min-w-[68px] rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 leading-tight',
                'transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.06]'
              )}
              data-testid={`readout-${tile.id}`}
            >
              <div className={cn(BASECAMP_MUTED, 'text-[9px] uppercase tracking-[0.06em]')}>
                {t(tile.labelKey)}
              </div>
              <div
                className={cn(
                  'text-[13px] font-semibold tabular-nums',
                  isKnown ? 'text-[#E8EDF5]' : cn(BASECAMP_MUTED, 'opacity-50')
                )}
                data-testid={`readout-value-${tile.id}`}
              >
                {formatTile(t, tile)}
              </div>
            </div>
          );
        })}
        {createdBy ? (
          <div
            // Tinted rather than neutral because this one is a name, not a
            // measurement — it is the only tile that points at another person.
            className="min-w-[68px] rounded-lg border border-[#B79CFF]/25 bg-[#B79CFF]/[0.08] px-2 py-1 leading-tight transition-colors duration-200 hover:border-[#B79CFF]/50 hover:bg-[#B79CFF]/[0.14]"
            data-testid="readout-created-by"
          >
            <div className="text-[9px] uppercase tracking-[0.06em] text-[#B79CFF]/70">
              {t('basecamp.patterns.labels.created_by')}
            </div>
            <Link
              href={`/@${createdBy}`}
              className={cn(BASECAMP_LINK, 'text-[13px] font-semibold hover:text-[#B79CFF]')}
            >
              {`@${createdBy}`}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CardReadouts;
