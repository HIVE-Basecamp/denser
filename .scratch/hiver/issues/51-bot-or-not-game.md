# Bot or Not: the first playable Puppet Patrol game

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-16: "Build the start of the Bot or Not game. It pulls up one
user. We could pull up any random user, but the point is: when someone labels
an account as a bot with the SUS button, start with those. I've already
labeled a few as bots — pull those into the game. Their profile is there, with
evaluation tools. Underneath the profile, two big buttons: one says BOT, one
says NOT. Click BOT and there's a spot that says why you think it's a bot —
maybe later there'll be multiple choice options if we start finding
commonalities, but right now just free writing, and it's not obligatory: you
can just choose bot without writing. NOT just means you don't think it's a
bot, click and move on. Underneath, possibly just repeat the postcard so they
have all that information — the profile is above it, then bot or not, then
below is the postcard where you can dig, and definitely a spot where you can
click into comments. It should be a little place where you can go and do
research. We'll come up with more things you can pull later."

## Answer

Built 2026-09-16. Not committed. First draft to look at, not a finished game.

**The queue is the SUS button's output, not a random account.** Every SUS
report this browser holds with `bot` ticked, newest first, one entry per
account — if the same person was reported on three posts, the newest post is
the one the game opens with. Read on the client only, like the SUS button
itself, because localStorage on the server is a hydration mismatch. Nothing
was invented to fill the queue: with no reports the game says "Nobody has been
labelled a bot yet" and points at the red SUS button. Reports ticked for other
reasons (extractor, spammer) stay out of this game — they are other games.

**The screen, top to bottom.** Big avatar, name, three plain numbers
(reputation, days old, posts), and four ways out to look for yourself: their
blog, their posts, their replies, and the Comments button that opens the last
25 comments in place. Then the two buttons, deliberately oversized. Then the
same postcard the feed draws, unchanged, with every readout and its popover.
The panel is narrower than the feed, so the card is told the width it is
drawing at (the tier the feed measures for itself) — without that the row
squeezed and the username was clipped, which is the one thing the card may
never do.

**BOT opens a box; NOT does not.** BOT reveals "Why do you think it's a bot?"
with Save underneath, and Save works with the box empty — writing it is
optional and the screen says so. NOT records and moves straight on. Skip moves
on without recording anything. Position shows as "1 of 2". When the queue runs
out the panel says so and offers to go round again; going round again shows
what you said last time on each account.

**Where the verdict goes: nowhere, yet, and it says so.** Same honesty as the
SUS report and the same storage: this browser, no expiry, nothing posted to
Hive, said in one line on screen. The shape is fixed now
(`lib/bot-or-not.ts`): account, the permlink it traces back to, bot or not,
the words, and the time.

Nothing here tells the player what a readout means. The tool still does not
decide (ETHOS.md); it puts the evidence in one place and gets out of the way,
which is a curator curating (CONTEXT.md).

## Files

- `apps/blog/features/basecamp/lib/bot-or-not.ts` — new. The verdict shape and
  read/save/remove in this browser's storage. No expiry.
- `apps/blog/features/basecamp/games/bot-or-not/use-bot-queue.ts` — new. Who
  the game pulls up, from the SUS reports.
- `apps/blog/features/basecamp/games/bot-or-not/use-suspect.ts` — new. Fetches
  the post and the account snapshot for one suspect.
- `apps/blog/features/basecamp/games/bot-or-not/suspect-profile.tsx` — new.
  Avatar, name, the three numbers, the ways out.
- `apps/blog/features/basecamp/games/bot-or-not/verdict-panel.tsx` — new. The
  two buttons and the optional box.
- `apps/blog/features/basecamp/games/bot-or-not/game-notice.tsx` — new. The
  empty and finished panels.
- `apps/blog/features/basecamp/games/bot-or-not/bot-or-not-game.tsx` — new.
  The screen, top to bottom.
- `apps/blog/features/basecamp/games/spot-the-bot-game.tsx` — was three lines
  of "coming soon"; now renders the game. Registry entry, accent and title key
  untouched.
- `apps/blog/locales/*/common_blog.json` (nine) — `basecamp.games.bot_or_not`,
  28 keys, translated in all nine, not left in English.

## Checked

Types clean, lint clean on all new files, every key present in all nine
locales and translation-usage validation passing. In the browser at 1280 wide,
with two bot reports and one extractor report seeded: the extractor stays out,
the queue reads "1 of 2", the profile and the postcard both draw, the username
prints whole, the card holds one line at the `tight` tier. BOT opens the box;
Save with the box empty writes `{verdict: 'bot', why: ''}` and advances; NOT
writes and advances; the finished panel appears; Start again reopens the first
account showing "You said: bot". Test reports and verdicts cleared afterwards.
No console errors from these files.

## Still open

- **The game's name.** The registry id is `spot_the_bot` and the button still
  says "Spot the Bot". Bryan calls it Bot or Not. Renaming the button is one
  translation key in nine files; renaming the id touches the registry. Not
  done without him saying so.
- **Nothing is sent anywhere**, same as the SUS report. When there is somewhere
  to send it, verdicts and reports need the same decision at once.
- **The queue is one browser's.** A player only ever sees accounts they
  themselves reported, so nobody can play on a fresh machine. A shared queue is
  the obvious next thing and needs somewhere to keep it.
- **"More things you can pull later"** — his words. Nothing beyond the profile,
  the postcard and the comments is pulled in yet.
- **No score, no streak, no reward.** It is a research desk, not yet a game in
  the sense the other three will be.
- `accountSnapshot` in `use-suspect.ts` duplicates the same mapping
  `hooks/use-newcomers.ts` makes for the feed. Two copies is fine; a third
  should be lifted out.

## Comments

**2026-09-16, Bryan, on the name.** "The name Spot the Bot is fine to keep."
Decided: the game keeps its name in the games row and its registry id. Bot or
Not stays the description of what you do in it, not the label on the button.
