# Sock or Not: the money half of the judging desk

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-16: "Make the sock or not game. Treat it very similar to the
spot the bot game. But more about if others are paying this account."

## Answer

Built 2026-09-16. First draft, same as Bot or Not was.

**Same desk, different question.** Bot or Not asks what an account WRITES.
Sock or Not asks who PAYS FOR IT — because that is what a sock gives away: the
same hand made the account, funds it and votes it up. Everything else is
deliberately the same shape, so the two games feel like one place: profile at
the top, two oversized buttons, an optional box for why, the full postcard
underneath, the comments a click away.

**Its own queue and its own record.** Seeded from the SUS button's `sock` tick,
not `bot` — an account ticked both turns up in both games, and a verdict in one
never touches the other. Stored in this browser, no expiry, nothing posted to
Hive, said in one line on screen. SOCK is orange where BOT is red, so which
question you are answering is obvious across the room.

**The money panel, between the buttons and the postcard.** Three things, in
one place:

- **Who made the account.** One line, linked. A sock's maker is usually its
  owner's other account.
- **Who has paid it, ranked.** Every HIVE and HBD transfer in, every power-up
  somebody else made into it, and every delegation lent to it — read from the
  chain with HAfAH's `participation-mode: exclude`, which is the only way to
  separate money coming IN from money going out. Each payer gets a share bar,
  the pieces their share is made of, and how many times they turn up. A payer
  who also created the account wears a marker saying so.
- **Who votes them up.** The voters panel built for the sixth petal, opened
  from here — votes are how most money actually reaches a Hive account.

**Three honesty rules in the maths, each one load-bearing.**

- A delegation is a LOAN, and a delegation operation sets the whole delegation
  to a new figure rather than adding to it. Summing them would report a
  delegator who went 100, 200, 0 as having lent 300. So the newest record per
  delegator stands, and zero means they took it all back.
- HIVE, HBD and VESTS are three different things. They are shown apart on every
  row and only combined for the ranking, where HBD is converted at today's
  median feed price (1 HIVE = 0.052 HBD on the day this was built) and VESTS at
  the chain-wide HP rate. Until both rates load there is no honest common unit,
  so the list falls back to how often each payer turns up — an ordering, never
  printed as a size.
- The endpoint pages from the OLDEST record, so asking with no page returns the
  newest page, which on nanixxx (1,308 incoming records) is a remainder of 308.
  Showing that alone would have understated the money by four fifths. The read
  now takes the newest page to learn the count, then the full pages behind it,
  up to five pages; past that the panel says what it is showing.

**What was lifted, and why.** The pieces both games share moved to
`games/judging/` — the queue, the one-account read, the profile, the two big
buttons, the research postcard, the empty/finished notice. The verdict stores
became one factory (`lib/verdicts.ts`) keyed per game, with Bot or Not keeping
its original storage key so verdicts already saved are still found. The shared
strings moved to `basecamp.games.judging.*` in all nine locales. Bot or Not was
rechecked afterwards and is unchanged to look at.

Checked live: nanixxx — 88 accounts paying, 1,308 records, 12,886 HIVE put in,
made by @appreciator; @coinex-hot at the top with 4,774 HIVE over 27 payments.
The empty state, the SOCK/why/save round trip, the queue advancing, and the
voters panel opening from inside the game were all exercised in the browser.

Nothing here tells the player what any of it means. One account behind all of
another's money is also what a parent funding a child, a project paying a
contributor and a community onboarding someone look like. The reader decides
(ETHOS.md).

## Follow-up, same day

Bryan: "I want both games to just pick an account if 1 hasn't been selected in
games."

Done, for Bot or Not and Sock or Not both. The queue still prefers accounts
ticked with the SUS button — that is the whole point of the games — but where
nothing is ticked it falls back to the Basecamp feed instead of sitting there
empty. New accounts, in feed order, minus any this game has already been
answered on, so going back in does not hand you the same person again. It is
the same feed query the page below is already running, so it costs no extra
reading.

The screen says where the account came from: "Nothing is marked with the SUS
button yet, so these are new accounts straight from the feed — nobody has
accused them of anything." An account that turned up on its own has had no
accusation made against it, and a player should know that before answering.
The "That's everyone" and "Nothing to look at" notices were reworded for the
same reason — they used to claim things had been labelled when nothing had.

One bug caught on the way in. The game holds the account it is on in an effect
keyed on that object; a feed queue rebuilt on every render gave it a new object
every time, which on an account already answered was a loop that never settled.
The queue is memoised now. Reproduced and confirmed fixed with Start again on a
judged account: zero renders in two seconds.

## The queue rule, settled

Bryan, after playing it: "You were meant to pick any post if there were no
selections from the game. So just pick the most recent post from the new users
feed. Never let it be blank, and never show me the old queue of already decided
bot entries. Only uncompleted from game or a new post from new user feed. Both
games should have that rule."

Two rules now, and they hold for both games:

**Never an account this game has already been answered on.** That includes the
ones marked with the SUS button — a verdict is finished work, and handing it
back is busywork. Marked-and-answered used to come round again on every visit,
which was the first thing wrong with it.

**Never empty.** Marked-and-unanswered come first; behind them, and the moment
they run out, new accounts from the Basecamp feed, newest post first. One
queue, not two modes: playing rolls straight from the last marked account into
the feed with no wall in between. The line saying where the account came from
now follows the account on the slab rather than the whole queue, because a
single queue holds both kinds.

The feed is asked for another page five accounts before the end, so it does not
run dry mid-play. Measured: a queue of 12 grew to 34 while being played, and to
32 while being skipped through at sixteen a second. Where a player does outrun
the chain the screen says "Finding somebody else", never "That's everyone" —
the finished notice only appears when the feed really has nothing left.

Checked: an account decided in Bot or Not but not in Sock or Not disappeared
from one game and stayed in the other; two accounts answered in a session were
gone after a reload; walking the whole queue never turned up either of them.

## Research leaves in a new tab

Bryan: "If you click in doing research to any of the things — like post or blog
or comments — it should only ever open a new tab, so that the original tab and
place is still there. Currently when you click it changes the same tab I'm
playing Sock or Not or Spot the Bot in, then I try to go back and I need to
re-enter. Better that the tab stay untouched so you can go off researching and
get back to the game on the same tab."

Everything that leaves a judging game now opens beside it: the avatar and name,
their blog, their posts, their replies, the account that made this one, every
payer in the money table, every comment in the comments panel, every voter in
the voters panel, and every link on the postcard underneath.

Three of those were one attribute each. The postcard was not: it is the feed's
own component, and on the feed following a link in place is exactly right, so
it must not be given a mode to carry around. The game wraps it and catches the
click instead — on the way DOWN, in the capture phase, because every link in
the card is a Next.js link that cancels the click itself and routes the page in
place. A bubbling handler sees it only after the navigation is already decided;
that was the first attempt and it did not work, which the browser check caught.
A modified click is still left alone, so the browser's own new-tab, new-window
and save-as handling is untouched.

The two panels — comments and voters — open a new tab from the feed as well.
They sit over whatever the reader was doing, and a link that navigates in place
throws away both the place and the read the panel just made.

Checked: five postcard links all opened `_blank` with the page and the game
untouched; 25 comment links and 8 voter links all `_blank`; the profile and the
money table all `_blank`.

## Open, not decided

- Whether the money panel belongs on the postcard too, or stays in the game.
- Whether outgoing money is worth showing beside incoming (where it goes after
  it arrives is the other half of the sock shape).
- Whether a SOCK verdict should say which OTHER account it is a sock of.
- Tick-box reasons for the "why" box, once commonalities appear. Same open
  question as Bot or Not's.
