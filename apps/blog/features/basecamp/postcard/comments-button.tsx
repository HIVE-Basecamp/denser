'use client';

import { useState } from 'react';
import { cn } from '@ui/lib/utils';
import { useTranslation } from '@/blog/i18n/client';
import { ACCOUNT_COMMENTS_LIMIT, useAccountComments } from '../hooks/use-account-comments';
import { BASECAMP_VIVID } from '../lib/theme';
import CommentsDialog from './comments-dialog';
import Hint from './hint';

/** Thick enough to be an edge in its own right, not a hairline on a coloured dome. */
const RIM_WIDTH = 3;
/** The rim, left and right together — the fitted button has no padding of its own. */
const SIDE_PADDING = RIM_WIDTH * 2;
/**
 * Fitted into a drawing's hollow the button is a half-disc, so it is at its
 * full width only along the bottom. Text is measured against that much of it.
 */
const TEXT_WIDTH_SHARE = 0.95;
/** Type size as a share of the button's height, and the range it is allowed to land in. */
const FONT_SHARE = 0.45;
const MIN_FONT = 8;
const MAX_FONT = 11;
/**
 * Roughly how wide one glyph prints, per point of type size — measured in the
 * browser, with a little slack. The type has to answer to the shape's width as
 * well as its height, so what is printed decides how large it can be printed.
 */
const WIDTH_PER_CHAR_PER_FONT = 0.7;

/** The rim: the card's neon pink, at Bryan's order — the loudest edge the palette has. */
const BUTTON_RIM = BASECAMP_VIVID.pink;

/**
 * Filled, not outlined, and in the one colour nothing else in the reply mix
 * uses. It is the hollow of a drawing rather than a shape sitting in open
 * space, so it has to read as a thing to press at a glance.
 */
const FILLED_STYLE = {
  backgroundColor: BASECAMP_VIVID.cyan,
  color: '#06201C',
  // A rim in a colour the fill does not use, so the dome's edge is unmistakable
  // against the arc it sits inside.
  border: `${RIM_WIDTH}px solid ${BUTTON_RIM}`,
  // The rim lit, the way the first post ring is: a tight bloom on the edge and
  // a wider, fainter one past it, both in the rim's own pink.
  boxShadow: `0 0 8px -1px ${BUTTON_RIM}, 0 0 18px -2px ${BUTTON_RIM}99`
};

/** Half an ellipse: round over the top, flat along the bottom — the U, filled. */
const HALF_DISC_RADIUS = '50% 50% 0 0 / 100% 100% 0 0';

interface CommentsButtonProps {
  account: string;
  /**
   * Defers the read until the card is near the viewport, so a long feed does
   * not ask the chain for every row's replies before anyone has scrolled to
   * them. The panel asks for itself when it opens, whatever this says.
   */
  enabled?: boolean;
  /**
   * The hollow the button has to fill, when it is being fitted into a drawing
   * — the U inside the reply mix half-moon. Given one, the button takes that
   * shape and fills it to its edges. Without one it draws as a plain pill at
   * its own comfortable size.
   */
  fit?: { width: number; height: number };
}

/**
 * The way into an account's replies. On the postcard it is the hollow of the
 * reply mix — the drawing that says what their replies are made of, holding
 * the button that shows the replies themselves.
 *
 * It carries the same popover every other thing on the card has, so nobody
 * has to guess what it opens. The panel is only mounted once it is open, so a
 * feed of cards asks the chain nothing until a reader actually asks to look.
 */
const CommentsButton = ({ account, fit, enabled = true }: CommentsButtonProps) => {
  const { t } = useTranslation('common_blog');
  const [open, setOpen] = useState(false);
  // The same read the panel makes, under the same key, so the button and the
  // list it opens can never disagree about how many there are.
  const { comments, known } = useAccountComments(account, enabled || open);

  const label = t('basecamp.card.comments.button');
  // How many replies they have written, to the depth this card reads: the
  // panel's own limit. Past that the number stops rather than guesses, which
  // is what Bryan asked for — a new account shows its seven, a busy one shows
  // the limit. Unknown is the card's dash, never a zero.
  const countText = known ? String(comments.length) : t('basecamp.signals.value_unknown');
  // Fitted into the drawing there is only room for a number, and the number is
  // the more useful of the two anyway. The free-standing pill keeps the word.
  const text = fit ? countText : label;
  const widthPerFont = Math.max(text.length, 1) * WIDTH_PER_CHAR_PER_FONT;
  const textWidth = fit ? fit.width * TEXT_WIDTH_SHARE - SIDE_PADDING : 0;
  const fontSize = fit
    ? Math.min(Math.max(Math.min(fit.height * FONT_SHARE, textWidth / widthPerFont), MIN_FONT), MAX_FONT)
    : undefined;

  return (
    <>
      <Hint title={label} body={t('basecamp.card.comments.hint', { limit: ACCOUNT_COMMENTS_LIMIT })}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={label}
          data-testid="postcard-comments-button"
          className={cn(
            'flex items-center justify-center overflow-hidden whitespace-nowrap font-bold leading-none tracking-[-0.01em] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95',
            fit ? 'h-full w-full' : 'rounded-full px-2.5 py-1 text-[11px]'
          )}
          style={{
            ...FILLED_STYLE,
            fontSize,
            borderRadius: fit ? HALF_DISC_RADIUS : undefined
          }}
        >
          {text}
        </button>
      </Hint>
      {open ? <CommentsDialog open={open} onOpenChange={setOpen} account={account} /> : null}
    </>
  );
};

export default CommentsButton;
