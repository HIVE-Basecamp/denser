'use client';

/**
 * H.I.V.E.R. — the controller card.
 *
 * Two jobs. It says which controller the browser has found, and it shows
 * which button does what. Under that it lights up every button AS YOU PRESS
 * IT, live, which is the only honest way to find out what a controller with
 * no famous name is really sending: press A, watch which slot lights.
 *
 * It reads the controller on its own clock rather than borrowing the game's,
 * because it is open while the game is paused behind it and a card that does
 * not respond to a press is worse than no card. Twenty readings a second is
 * far more than an eye needs and costs nothing.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from '@/blog/i18n/client';
import { DEFAULT_PAD_MAP, PAD_BUTTONS, padStick, type PadAction } from '../lib/pad';

export interface PadCardProps {
  /** The controller's own name, as the browser reports it. */
  name: string;
  onClose: () => void;
}

/** The actions, in the order they are worth reading, with the key each mirrors. */
const ROWS: { action: PadAction; key: string }[] = [
  { action: 'hop', key: 'Space' },
  { action: 'fire', key: 'F' },
  { action: 'map', key: 'M' },
  { action: 'close', key: 'Esc' },
  { action: 'dashboard', key: 'I' },
  { action: 'fullscreen', key: '—' },
  { action: 'grid', key: 'G' },
  { action: 'mode', key: '—' }
];

/** How often the card re-reads the controller, in milliseconds. */
const READ_MS = 50;

interface Live {
  down: boolean[];
  x: number;
  y: number;
  standard: boolean;
}

export const PadCard = ({ name, onClose }: PadCardProps) => {
  const { t } = useTranslation('common_blog');
  const [live, setLive] = useState<Live>({ down: [], x: 0, y: 0, standard: true });

  useEffect(() => {
    const read = () => {
      const list = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
      for (const pad of list) {
        if (!pad || !pad.connected) continue;
        const stick = padStick(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
        setLive({
          down: pad.buttons.map((b) => b.pressed),
          x: stick.x,
          y: stick.y,
          standard: pad.mapping === 'standard'
        });
        return;
      }
    };
    const id = window.setInterval(read, READ_MS);
    return () => window.clearInterval(id);
  }, []);

  const leaning = Math.hypot(live.x, live.y) > 0;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-full w-full max-w-md overflow-auto rounded-2xl border border-[#5df0ff]/40 bg-[#05080f] p-4 font-mono text-xs text-[#cfe6ef] shadow-2xl">
        <div className="mb-1 flex items-start justify-between gap-3">
          <span className="text-sm font-bold text-[#5df0ff]">{t('hive_frontend_universe.pad.title')}</span>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[11px] text-[#cfe6ef]"
          >
            {t('hive_frontend_universe.pad.close')}
          </button>
        </div>
        <p className="mb-3 break-words text-[11px] text-[#8fa6b4]">{name}</p>

        {/* A controller that does not claim the standard order may land on the
            wrong actions. Say so rather than letting it feel broken. */}
        {live.standard ? null : (
          <p className="mb-3 rounded-md border border-[#ffd24a]/40 bg-[#ffd24a]/10 p-2 text-[11px] text-[#ffd24a]">
            {t('hive_frontend_universe.pad.non_standard')}
          </p>
        )}

        <table className="mb-4 w-full border-collapse">
          <tbody>
            {ROWS.map(({ action, key }) => {
              const index = DEFAULT_PAD_MAP[action];
              const on = live.down[index] === true;
              return (
                <tr key={action} className="border-t border-white/10">
                  <td className="py-1 pr-2">{t(`hive_frontend_universe.pad.actions.${action}`)}</td>
                  <td className="py-1 pr-2 text-right">
                    <span
                      className={
                        on
                          ? 'rounded bg-[#5df0ff] px-1.5 py-0.5 font-bold text-[#04060a]'
                          : 'rounded bg-white/10 px-1.5 py-0.5 text-[#e9f4f8]'
                      }
                    >
                      {PAD_BUTTONS[index] ?? index}
                    </span>
                  </td>
                  <td className="w-12 py-1 text-right text-[#65808f]">{key}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mb-2 text-[11px] text-[#8fa6b4]">{t('hive_frontend_universe.pad.test')}</p>
        <div className="mb-3 flex flex-wrap gap-1">
          {PAD_BUTTONS.map((label, i) => (
            <span
              key={label}
              className={
                live.down[i]
                  ? 'rounded bg-[#5df0ff] px-1.5 py-0.5 font-bold text-[#04060a]'
                  : 'rounded bg-white/5 px-1.5 py-0.5 text-[#65808f]'
              }
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-[11px]">
          <span className="text-[#8fa6b4]">{t('hive_frontend_universe.pad.stick')} </span>
          <span className={leaning ? 'font-bold text-[#5df0ff]' : 'text-[#65808f]'}>
            {live.x.toFixed(2)}, {live.y.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default PadCard;
