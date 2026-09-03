'use client';

import { Check } from 'lucide-react';
import { Checkbox } from '@ui/components/checkbox';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { BASECAMP_PANEL, BASECAMP_MUTED } from './lib/theme';
import { useUserClient } from '@smart-signer/lib/auth/use-user-client';
import { useBasecampState } from './hooks/use-basecamp-state';
import { useAccountHistory } from './hooks/use-account-history';
import { useBasecampTaskMutation } from './hooks/use-basecamp-mutations';
import {
  DERIVED_CHECKLIST_ITEMS,
  DECLARED_CHECKLIST_ITEMS,
  CHECKLIST_TOTAL,
  countCompletedChecklistItems
} from './lib/checklist';
import { type BasecampTaskId } from './lib/protocol';

const DONE_COLOR = '#B79CFF';

/**
 * A derived row. Not a control: there is nothing to click, because the chain
 * already answered. Rendered as a marker rather than a disabled checkbox so it
 * never reads as something the person failed to tick.
 */
const DerivedRow = ({ label, done }: { label: string; done: boolean }) => (
  <li className="flex items-center gap-3 text-sm">
    <span
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
        done ? 'border-transparent text-[#0B0F17]' : 'border-white/30'
      )}
      style={done ? { backgroundColor: DONE_COLOR } : undefined}
      aria-hidden
    >
      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
    </span>
    <span className={done ? cn(BASECAMP_MUTED, 'line-through') : undefined}>{label}</span>
  </li>
);

const Checklist = () => {
  const { t } = useTranslation('common_blog');
  const { user } = useUserClient();
  const { state } = useBasecampState(user.username);
  const { facts, status } = useAccountHistory(user.username);
  const taskMutation = useBasecampTaskMutation();

  const completed = countCompletedChecklistItems(facts);

  return (
    <div className={cn(BASECAMP_PANEL, 'my-4')} data-testid="basecamp-checklist">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">{t('basecamp.checklist.heading')}</span>
        <span className={cn(BASECAMP_MUTED, 'text-xs tabular-nums')}>
          {t('basecamp.rings.progress', { done: completed, total: CHECKLIST_TOTAL })}
        </span>
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-[#98A6BC]">
        {t('basecamp.checklist.done_on_hive')}
      </span>
      <p className={cn(BASECAMP_MUTED, 'mb-2 mt-0.5 text-xs')}>
        {t('basecamp.checklist.done_on_hive_note')}
      </p>
      {status === 'unavailable' ? (
        <p className={cn(BASECAMP_MUTED, 'text-sm')} data-testid="checklist-facts-unavailable">
          {t('basecamp.checklist.not_measured')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="checklist-derived">
          {DERIVED_CHECKLIST_ITEMS.map((item) => (
            <DerivedRow
              key={item.id}
              label={t(item.labelKey)}
              done={status === 'ready' && Boolean(item.isDone?.(facts))}
            />
          ))}
        </ul>
      )}

      <span className="mt-5 block text-xs font-semibold uppercase tracking-wider text-[#98A6BC]">
        {t('basecamp.checklist.said_so')}
      </span>
      <p className={cn(BASECAMP_MUTED, 'mb-2 mt-0.5 text-xs')}>{t('basecamp.checklist.said_so_note')}</p>
      <ul className="flex flex-col gap-3" data-testid="checklist-declared">
        {DECLARED_CHECKLIST_ITEMS.map((item) => {
          const task = item.id as BasecampTaskId;
          const done = state.completedTasks.includes(task);
          const pending = taskMutation.isLoading && taskMutation.variables?.task === task;
          return (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              <Checkbox
                id={`checklist-${item.id}`}
                checked={done}
                disabled={done || pending}
                // One-way on chain: there is no "uncomplete" action.
                onCheckedChange={() => {
                  if (!done) taskMutation.mutate({ task });
                }}
                className={cn('border-white/30', done && 'border-[#B79CFF] bg-[#B79CFF] text-[#0B0F17]')}
                data-testid={`checklist-item-${item.id}`}
              />
              <label
                htmlFor={`checklist-${item.id}`}
                className={done ? cn(BASECAMP_MUTED, 'cursor-pointer line-through') : 'cursor-pointer'}
              >
                {t(item.labelKey)}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Checklist;
