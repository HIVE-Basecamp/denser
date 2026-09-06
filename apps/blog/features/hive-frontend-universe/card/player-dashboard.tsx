'use client';

/**
 * H.I.V.E.R. - the pop-up dashboard.
 *
 * Bryan's Zelda pop-up: what the player is carrying, how strong they are,
 * what they have been paying attention to. This is the ROUGH one, built to
 * settle WHICH facts belong here before any layout work: a plain list of
 * rows the engine hands over. The engine owns the numbers; this file only
 * shows them.
 */

import { useTranslation } from '@/blog/i18n/client';

export interface DashboardRow {
  label: string;
  value: string;
  /** Row colour, when the fact has one (mode accent, race gold). */
  accent?: string;
}

export interface PlayerDashboardProps {
  title: string;
  rows: DashboardRow[];
  onClose: () => void;
}

export const PlayerDashboard = ({ title, rows, onClose }: PlayerDashboardProps) => {
  const { t } = useTranslation('common_blog');
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-[400px] rounded-xl border border-[#5df0ff]/60 bg-[#080d13]/95 p-4 backdrop-blur-sm"
        data-testid="hfu-dashboard"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-[#e9f4f8]">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-2 py-1 font-mono text-xs text-[#8fa6b4] transition-colors hover:bg-white/5"
            data-testid="hfu-dashboard-close"
          >
            {t('hive_frontend_universe.dashboard.close')}
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="font-mono text-[11px] uppercase tracking-wide text-[#8fa6b4]">{r.label}</dt>
              <dd className="text-right font-mono text-xs" style={{ color: r.accent ?? '#e9f4f8' }}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
