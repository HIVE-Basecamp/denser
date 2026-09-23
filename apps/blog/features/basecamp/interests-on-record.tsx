'use client';

import { useState } from 'react';
import { Button } from '@hive/ui';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import DialogLogin from '@/blog/components/dialog-login';
import { BASECAMP_PANEL, accentButton } from './lib/theme';
import { useUserClient } from '@smart-signer/lib/auth/use-user-client';
import { useBasecampState } from './hooks/use-basecamp-state';
import { useBasecampInterestsMutation } from './hooks/use-basecamp-mutations';
import InterestPicker from './interest-picker';
import { isBasecampInterest, MAX_BASECAMP_INTERESTS, type BasecampInterest } from './lib/protocol';

const InterestsOnRecord = () => {
  const { t } = useTranslation('common_blog');
  const { user } = useUserClient();
  const { state } = useBasecampState(user.username);
  const interestsMutation = useBasecampInterestsMutation();
  const [selected, setSelected] = useState<BasecampInterest[]>([]);
  // Changing what is on record: the picker opens again with the current set
  // already ticked, and confirming writes a new `interests` record, which
  // replaces the old one (lib/protocol.ts folds the newest as the whole set).
  const [editing, setEditing] = useState(false);

  const onRecord = state.interests.filter(isBasecampInterest);

  const toggleInterest = (interest: BasecampInterest) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < MAX_BASECAMP_INTERESTS
          ? [...prev, interest]
          : prev
    );
  };

  const startEditing = () => {
    setSelected(onRecord);
    setEditing(true);
  };

  const confirm = () =>
    interestsMutation.mutate({ interests: selected }, { onSuccess: () => setEditing(false) });

  if (onRecord.length > 0 && !editing) {
    return (
      <div
        className={cn(BASECAMP_PANEL, 'my-4 flex flex-wrap items-center justify-between gap-3 text-sm')}
        data-testid="interests-on-record-current"
      >
        <span>
          {t('basecamp.interest_picker.on_record', {
            interests: onRecord
              .map((interest) => t(`basecamp.interest_picker.interests.${interest}`))
              .join(', ')
          })}
        </span>
        <Button
          variant="outline"
          size="sm"
          className={cn(accentButton('emerald', false))}
          onClick={startEditing}
          data-testid="interests-on-record-change"
        >
          {t('basecamp.interest_picker.change')}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(BASECAMP_PANEL, 'my-4 flex flex-col gap-3')} data-testid="interests-on-record-form">
      <span className="text-sm font-semibold">{t('basecamp.interest_picker.heading')}</span>
      <InterestPicker selected={selected} onToggle={toggleInterest} maxSelected={MAX_BASECAMP_INTERESTS} />
      <div className="flex flex-wrap items-center gap-2">
        {/* Putting interests on record is a signed operation. Signed out, the
            button opens the sign-in dialog — the same gate the rest of the site
            puts in front of a vote or a follow — rather than failing to sign. */}
        {user.isLoggedIn ? (
          <Button
            className={cn(accentButton('emerald', true), 'w-fit')}
            onClick={confirm}
            disabled={selected.length === 0 || interestsMutation.isLoading}
            data-testid="interests-on-record-confirm"
          >
            {t('basecamp.interest_picker.confirm')}
          </Button>
        ) : (
          <DialogLogin>
            <Button
              className={cn(accentButton('emerald', true), 'w-fit')}
              disabled={selected.length === 0}
              data-testid="interests-on-record-confirm"
            >
              {t('basecamp.interest_picker.confirm')}
            </Button>
          </DialogLogin>
        )}
        {editing ? (
          <Button
            variant="outline"
            size="sm"
            className={cn(accentButton('emerald', false))}
            onClick={() => setEditing(false)}
            disabled={interestsMutation.isLoading}
            data-testid="interests-on-record-cancel"
          >
            {t('basecamp.interest_picker.cancel')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default InterestsOnRecord;
