'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@ui/lib/utils';
import { setStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';
import { useUserClient } from '@smart-signer/lib/auth/use-user-client';
import { useTranslation } from '@/blog/i18n/client';
import { ReplyTextbox } from '@/blog/features/post-editor/reply-textbox';
import { DEFAULT_OBSERVER } from '@/blog/lib/utils';
import { BASECAMP_MUTED } from '../../lib/theme';
import {
  BUILT_IN_TEMPLATES,
  fillTemplate,
  newTemplateId,
  readTemplates,
  removeTemplate,
  saveTemplate,
  type PersonalTemplate
} from '../../lib/welcome-templates';

const CHIP =
  'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors border-[#5BE39C]/45 bg-[#5BE39C]/10 text-[#9CEFC4] hover:border-[#5BE39C] hover:bg-[#5BE39C]/22';
const CHIP_PLAIN =
  'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors border-white/20 bg-white/5 text-[#B9C4D6] hover:border-white/40 hover:bg-white/10';
const FIELD =
  'w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-[#E8EDF5] outline-none transition-colors placeholder:text-[#5E6A7E] focus:border-[#5BE39C]/60';

export interface WelcomePanelProps {
  /** The post being replied to. */
  account: string;
  permlink: string;
}

/**
 * Saying something to somebody who just arrived.
 *
 * A first post usually gets nothing at all, and the reason is almost never
 * unkindness — it is that writing a reply from cold is work, and the moment
 * passes. So the work is done in advance: three ready-made replies, the
 * player's own saved ones beside them, and a plain box for anyone who would
 * rather start empty.
 *
 * NOTHING IS EVER SENT FROM HERE. A template only fills the box in; the reply
 * that goes out is the ordinary Hive reply box, and the player reads it,
 * changes whatever they like and presses Publish themselves. That is the whole
 * design and it is not a limitation: a welcome nobody read before it went out
 * is not a welcome, and a hundred identical replies are spam whoever sent
 * them.
 *
 * HOW THE BOX IS FILLED. The reply box keeps a draft for each post under a key
 * of its own and loads it when it opens, so a template is put INTO that draft
 * and the box is opened afterwards. Nothing in the reply box had to change,
 * and the draft survives a reload the way any other half-written reply does.
 */
const WelcomePanel = ({ account, permlink }: WelcomePanelProps) => {
  const { t } = useTranslation('common_blog');
  const { user } = useUserClient();
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<PersonalTemplate[]>([]);
  const [writing, setWriting] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);

  // Storage is read on the client only: the server has none, and a list that
  // is empty there and full here is a hydration mismatch.
  const owner = user?.username ?? '';
  useEffect(() => setMine(readTemplates(owner)), [owner]);

  // A different post on the slab closes whatever was open for the last one.
  useEffect(() => {
    setOpen(false);
    setWriting(false);
  }, [account, permlink]);

  const signedIn = Boolean(user?.isLoggedIn && owner);

  /** Put the words in the reply box's own draft, then open the box on them. */
  const startWith = useCallback(
    (body: string) => {
      if (!signedIn) return;
      setStorageItem(`replyTo-/${account}/${permlink}-${owner}`, body, StorageTTL.DRAFT);
      setOpen(true);
    },
    [account, permlink, signedIn, owner]
  );

  const k = 'basecamp.games.newbie_or_not';

  const keepTemplate = () => {
    const body = draftBody.trim();
    if (!body) return;
    const template: PersonalTemplate = {
      id: newTemplateId(),
      name: draftName.trim() || t(`${k}.templates.untitled`),
      body,
      savedIso: new Date().toISOString()
    };
    // A save that did not save must SAY so. Bryan wrote a template and came
    // back to find it gone (2026-09-19); whatever the cause, the screen
    // telling him it had worked was the part that made it bad.
    try {
      saveTemplate(owner, template);
    } catch {
      setSaveFailed(true);
      return;
    }
    setSaveFailed(false);
    setMine(readTemplates(owner));
    setWriting(false);
    setDraftName('');
    setDraftBody('');
    startWith(fillTemplate(body, account));
  };

  const forget = (id: string) => {
    removeTemplate(owner, id);
    setMine(readTemplates(owner));
  };

  if (!signedIn) {
    return (
      <div className={cn(BASECAMP_MUTED, 'text-[12px] leading-snug')} data-testid="newbie-welcome-signed-out">
        {t(`${k}.templates.signed_out`)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="newbie-welcome">
      <div>
        <p className="text-[12px] font-semibold text-[#B9C4D6]">{t(`${k}.templates.heading`)}</p>
        <p className={cn(BASECAMP_MUTED, 'text-[11px] leading-snug')}>{t(`${k}.templates.hint`)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUILT_IN_TEMPLATES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => startWith(fillTemplate(t(`${k}.templates.built_in.${id}.body`), account))}
            className={CHIP}
            data-testid={`newbie-template-${id}`}
          >
            {t(`${k}.templates.built_in.${id}.name`)}
          </button>
        ))}

        {mine.map((template) => (
          <span key={template.id} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => startWith(fillTemplate(template.body, account))}
              className={CHIP}
              data-testid="newbie-template-mine"
            >
              {template.name}
            </button>
            <button
              type="button"
              onClick={() => forget(template.id)}
              aria-label={t(`${k}.templates.forget`, { name: template.name })}
              className={cn(BASECAMP_MUTED, 'px-1 text-[13px] leading-none hover:text-[#FF8BA1]')}
            >
              &times;
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setWriting((was) => !was)}
          className={CHIP_PLAIN}
          data-testid="newbie-template-new"
        >
          {t(`${k}.templates.make_own`)}
        </button>
        <button
          type="button"
          onClick={() => startWith('')}
          className={CHIP_PLAIN}
          data-testid="newbie-comment-blank"
        >
          {t(`${k}.templates.from_scratch`)}
        </button>
      </div>

      {writing ? (
        <div
          className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
          data-testid="newbie-template-form"
        >
          <p className="text-[12px] font-semibold text-[#B9C4D6]">{t(`${k}.templates.add_heading`)}</p>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#B9C4D6]">{t(`${k}.templates.name_label`)}</span>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={t(`${k}.templates.name_placeholder`)}
              className={FIELD}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#B9C4D6]">{t(`${k}.templates.body_label`)}</span>
            <textarea
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              rows={4}
              placeholder={t(`${k}.templates.body_placeholder`)}
              className={cn(FIELD, 'resize-none')}
            />
          </label>
          <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>{t(`${k}.templates.name_token`)}</p>
          {/*
            Said plainly, because the whole point of keeping one is that it is
            there next time - and because the limit is real: this is browser
            storage, not the account's own records.
          */}
          <p className={cn(BASECAMP_MUTED, 'text-[10.5px] leading-snug')}>
            {t(`${k}.templates.kept_forever`)}
          </p>
          {saveFailed ? (
            <p className="text-[11px] font-semibold text-[#FF8BA1]" data-testid="newbie-template-failed">
              {t(`${k}.templates.save_failed`)}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWriting(false)}
              className={cn(BASECAMP_MUTED, 'text-[11px] hover:text-[#E8EDF5]')}
            >
              {t('basecamp.games.judging.cancel')}
            </button>
            <button
              type="button"
              onClick={keepTemplate}
              className="ml-auto rounded-full bg-[#5BE39C] px-4 py-1.5 text-[12px] font-bold text-[#032315] transition-colors hover:bg-[#8AEEBA]"
              data-testid="newbie-template-save"
            >
              {t(`${k}.templates.keep`)}
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-2" data-testid="newbie-reply">
          <p className={cn(BASECAMP_MUTED, 'mb-2 px-1 text-[11px] leading-snug')}>
            {t(`${k}.templates.before_publish`)}
          </p>
          <ReplyTextbox
            editMode={false}
            onSetReply={setOpen}
            username={account}
            permlink={permlink}
            storageId={`newbie-${account}-${permlink}`}
            comment=""
            discussionAuthor={account}
            discussionPermlink={permlink}
            observer={owner || DEFAULT_OBSERVER}
          />
        </div>
      ) : null}
    </div>
  );
};

export default WelcomePanel;
