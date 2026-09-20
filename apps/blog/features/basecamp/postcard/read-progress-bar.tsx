'use client';

import { cn } from '@ui/lib/utils';
import { BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';

const CYAN = BASECAMP_VIVID.cyan;

/** Until the read has got this far there is nothing to draw but motion. */
const MIN_BAR_PROGRESS = 0.02;

interface ReadProgressBarProps {
  /** 0-1, or null where nothing honest can be said yet: the bar pulses instead. */
  progress: number | null;
  /** The sentence beside the bar — how long is left, or that it is reading. */
  label: string;
  /** Offered only by reads that can be abandoned with what they have. */
  onStop?: () => void;
  stopLabel?: string;
  testId?: string;
}

/**
 * What a long read is doing, while it does it.
 *
 * Never a bare spinner. These reads can run for half a minute on a busy
 * account, and a reader who cannot see it moving has no way to tell working
 * from broken. So: a bar, roughly how long is left, and — where the read is one
 * that can be abandoned without losing what it found — a way out.
 */
const ReadProgressBar = ({ progress, label, onStop, stopLabel, testId }: ReadProgressBarProps) => {
  const width = progress === null ? MIN_BAR_PROGRESS : Math.max(progress, MIN_BAR_PROGRESS);

  return (
    <div className="flex items-center gap-3" data-testid={testId}>
      <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-500',
            progress === null && 'animate-pulse'
          )}
          style={{ width: `${width * 100}%`, backgroundColor: CYAN, boxShadow: `0 0 8px -1px ${CYAN}` }}
        />
      </span>
      <span className={cn(BASECAMP_MUTED, 'shrink-0 text-[10.5px] tabular-nums')}>{label}</span>
      {onStop && stopLabel ? (
        <button
          type="button"
          onClick={onStop}
          className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] font-semibold text-[#E8EDF5] transition-colors hover:border-white/40"
          data-testid={testId ? `${testId}-stop` : undefined}
        >
          {stopLabel}
        </button>
      ) : null}
    </div>
  );
};

export default ReadProgressBar;
