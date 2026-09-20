'use client';

import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from '@ui/components/tooltip';
import { cn } from '@ui/lib/utils';
import { BASECAMP_HINT, BASECAMP_MUTED } from '../lib/theme';

export interface HintRow {
  /** Empty for a line that is not a slice of the drawing: no dot is drawn. */
  color: string;
  label: string;
  value: string;
}

interface HintProps {
  title: string;
  body: string;
  /** The reading in full, printed beside the title — the drawing may have shortened it. */
  value?: string;
  /** For segmented drawings: one line per slice, with its colour. */
  rows?: HintRow[];
  /** Context lines under a rule: read, not drawn, so they carry no colour. */
  extras?: HintRow[];
  /** A closing line in the accent colour — what happens if the reader clicks. */
  action?: string;
  children: ReactNode;
}

/**
 * The explanation behind every readout. A real popover, not the browser's
 * own `title` — that one takes a second to appear and is easy to miss, and a
 * reader who never sees the sentence never learns what the drawing counts.
 *
 * The content is portalled to the body: some triggers are SVG groups, and a
 * div rendered inside an <svg> would never paint.
 */
/** One line of a popover list: a dot only where the line is a slice of the drawing. */
const Line = ({ row }: { row: HintRow }) => (
  <li className="flex items-center gap-1.5 text-[10.5px]">
    {row.color ? (
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
    ) : (
      <span className="h-2 w-2 shrink-0" aria-hidden="true" />
    )}
    <span className={cn(BASECAMP_MUTED, 'flex-1')}>{row.label}</span>
    <span className="font-semibold tabular-nums text-[#E8EDF5]">{row.value}</span>
  </li>
);

const Hint = ({ title, body, value, rows, extras, action, children }: HintProps) => (
  <TooltipProvider delayDuration={120}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent side="top" sideOffset={6} className={BASECAMP_HINT}>
          <div className="mb-0.5 flex items-baseline justify-between gap-3 text-[11px] font-semibold text-[#E8EDF5]">
            <span>{title}</span>
            {value ? <span className="tabular-nums text-[#B79CFF]">{value}</span> : null}
          </div>
          <div className={cn(BASECAMP_MUTED, 'text-[10.5px]')}>{body}</div>
          {rows && rows.length > 0 ? (
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {rows.map((row) => (
                <Line key={row.label} row={row} />
              ))}
            </ul>
          ) : null}
          {extras && extras.length > 0 ? (
            <ul className="mt-1.5 flex flex-col gap-0.5 border-t border-white/10 pt-1.5">
              {extras.map((row) => (
                <Line key={row.label} row={row} />
              ))}
            </ul>
          ) : null}
          {action ? <div className="mt-1.5 text-[10.5px] font-semibold text-[#B79CFF]">{action}</div> : null}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  </TooltipProvider>
);

export default Hint;
