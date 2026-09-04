'use client';

import { useId } from 'react';
import { Link } from '@hive/ui';
import { getUserAvatarUrl } from '@ui/lib/avatar-utils';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import Petal, {
  FLOWER_BOX,
  FLOWER_CENTER,
  FLOWER_CORE_RADIUS,
  FLOWER_GROUND,
  FLOWER_HAZE_RADIUS,
  petalAngle
} from '../viz/flower';
import type { Readout } from '../lib/readouts';
import { BASECAMP_MUTED, BASECAMP_VIVID } from '../lib/theme';
import { formatPetalValue, formatReadoutValue } from './format-value';
import Hint from './hint';

/** The middle, as a share of the flower: an avatar about the size of the one on the identity line. */
const CORE_SHARE = 0.25;
const GLOW_BLUR = 2.2;

interface FlowerCoreProps {
  readout: Readout;
  size: number;
}

/** Who created the account, as their face in the middle of the flower. */
const FlowerCore = ({ readout, size }: FlowerCoreProps) => {
  const { t } = useTranslation('common_blog');
  const creator = readout.text ?? null;
  const title = t('basecamp.card.labels.created_by');
  const unknown = t('basecamp.signals.value_unknown');
  const box = { width: size, height: size };

  return (
    <Hint title={title} body={t('basecamp.card.hints.created_by')} value={creator ? `@${creator}` : unknown}>
      {creator ? (
        <Link
          href={`/@${creator}`}
          className="block rounded-full ring-1 ring-white/20 transition-shadow hover:ring-2 hover:ring-[#B79CFF]/70"
          aria-label={`${title}: @${creator}`}
          data-testid="readout-created_by"
          data-readout-known="true"
        >
          <span
            className="block rounded-full bg-cover bg-no-repeat"
            style={{ ...box, backgroundImage: `url(${getUserAvatarUrl(creator, 'small')})` }}
          />
        </Link>
      ) : (
        <span
          className={cn(
            BASECAMP_MUTED,
            'flex cursor-default items-center justify-center rounded-full bg-white/5 text-[11px] ring-1 ring-white/20'
          )}
          style={box}
          data-testid="readout-created_by"
          data-readout-known="false"
        >
          {unknown}
        </span>
      )}
    </Hint>
  );
};

interface FlowerReadoutProps {
  petals: Readout[];
  core?: Readout;
  /** Rendered width and height in px. */
  size: number;
}

/**
 * The five numbers about how the account is used, as one flower: a petal
 * each, in its own colour, opening as far as its own number, with the number
 * printed on it. No names on the card — every petal explains itself in a
 * popover — and the account's creator sits in the middle.
 */
const FlowerReadout = ({ petals, core, size }: FlowerReadoutProps) => {
  const { t } = useTranslation('common_blog');
  const idBase = useId().replace(/:/g, '');
  const glowId = `flower-glow-${idBase}`;
  const hazeId = `flower-haze-${idBase}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} data-testid="postcard-flower">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${FLOWER_BOX} ${FLOWER_BOX}`}
        className="overflow-visible"
        role="img"
        aria-label={t('basecamp.card.labels.flower')}
      >
        <defs>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={GLOW_BLUR} />
          </filter>
          <radialGradient id={hazeId}>
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.07} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={FLOWER_CENTER} cy={FLOWER_CENTER} r={FLOWER_HAZE_RADIUS} fill={`url(#${hazeId})`} pointerEvents="none" />
        {petals.map((readout, index) => {
          const label = t(`basecamp.card.labels.${readout.id}`);
          const full = readout.pair
            ? t('basecamp.card.values.pair', { first: readout.pair[0], second: readout.pair[1] })
            : formatReadoutValue(t, readout);
          return (
            <Hint key={readout.id} title={label} value={full} body={t(`basecamp.card.hints.${readout.id}`)}>
              <Petal
                angle={petalAngle(index, petals.length)}
                ratio={readout.ratio}
                color={BASECAMP_VIVID[readout.colors[0]]}
                known={readout.known}
                text={formatPetalValue(t, readout)}
                glowId={glowId}
                tabIndex={0}
                role="img"
                aria-label={`${label}: ${full}`}
                className="cursor-default outline-none"
                data-testid={`readout-${readout.id}`}
                data-readout-known={readout.known ? 'true' : 'false'}
                data-readout-ratio={readout.ratio.toFixed(3)}
              />
            </Hint>
          );
        })}
        <circle cx={FLOWER_CENTER} cy={FLOWER_CENTER} r={FLOWER_CORE_RADIUS} fill={FLOWER_GROUND} pointerEvents="none" />
      </svg>
      {core ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <FlowerCore readout={core} size={Math.round(size * CORE_SHARE)} />
        </div>
      ) : null}
    </div>
  );
};

export default FlowerReadout;
