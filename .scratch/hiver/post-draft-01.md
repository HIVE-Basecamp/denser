# A month on Hive Basecamp — and the game that fell out of it

*Development update, 3 August – 8 September 2026.*

Ask anyone on Hive why we can't keep new people and you get the same answer,
worded a hundred ways: they show up, they post, nobody answers, they leave.

We have all said it. For years.

Signing up is better now. Not fixed — better. No longer the unbearable part.
The unbearable part is what comes after: you are in, and nothing tells you what
to do, where to go, or who to talk to. You post into silence.

That silence is the void.

The half we say out loud less: plenty of OG users would gladly help. They don't,
because finding one real person among the scammers, bots and extractors is
exhausting.

So the new person gets no answer, and the old hand finds no one worth answering.
Two halves of the same problem, holding each other still. Basecamp is an attempt
to move both at once.

I have been having this conversation for years, a lot of it on Hive Thrive. All
good talk. All symptoms. I wanted the medicine.

Then Acidyo put a proposal to the DHF for code subscriptions. That was the
opening.

## What it paid for

$100. One month of a Claude Max subscription. That is the entire budget for
everything below.

Which means yes, I built this with an AI assistant, and I am not going to be coy
about it. The hours are still hours: 2 to 3 a day, most days of the month. Call
it somewhere near a hundred. An honest estimate, not a tracked number — I did
not keep a timer.

Small money. It changed the job anyway. Before it I was building something
because I wanted it to exist. After it, someone had decided to back it, and that
turns an idea into an obligation to do right by the people who would use it —
something genuinely useful and genuinely fun, not just finished.

The part I did not expect is what it did to me. More committed to Hive, not
less. Worth saying out loud on a chain that argues a lot about whether funding
works.

Before the list: this is not deployed. It runs on my machine, and nobody has
played it because they wanted to. What follows is a month of work, not a launch.

## What got built

**3–12 Aug — Basecamp.** Landing page wired to real chain data. Real feed
sourcing. Activity rings and the dark redesign. The Puppet Patrol games, first
one playable. The signal registry behind the postcards.

[SCREENSHOT: Basecamp feed — a postcard with the activity rings]

**14–24 Aug — H.I.V.E.R., in 35 numbered passes.** A game map you fly over,
shaped like the Hive mark. One connected world, no dead ends. A ring of witness
citadels. No labels — everything is clickable instead. Emperor J SON, the
thieves, the oxygen helmets. Named creatures and rides. Mount Socko. The Steem
Ruins. Your own avatar riding the bug.

Every one of those 35 commits ends with a KNOWN ISSUES section saying plainly
what was stubbed, faked or ugly. Read that log rather than take my word here.

**30 Aug – 6 Sep — the thinking pass.** Less building, more arguing. Ethos and
glossary written down. Joining removed entirely. The account-age gate removed.
Then the welcome and four modes, the DHF race, the ruins that flip the board,
the planet pass.

[SCREENSHOT: the welcome and mode picker, or the planet view mid-pull-out]

**7–8 Sep — hardening.** Obstacles on the streets. Footprints. The ending at the
keep. A tidy-up so a stranger can read the code, and the first automatic checks
the project has ever had.

## What is real chain data

The part I most want checked, because it is the whole point.

- The ~30 houses are **real posts from the current 30-minute round**, with the
  authors' real profile photos.
- The citadels are the **actual top 21 consensus witnesses**, in vote order.
- The collectable tokens are minted from the round's **real `custom_json` count**.
- Ambient traffic is scaled from the round's **real vote, comment and transfer
  counts**.
- The keep's panel shows the **real DHF vault, live** — including that the
  account holds no keys at all.

**The game writes nothing to the chain.** Read-only, everywhere.

[SCREENSHOT: a house popover showing the real post and author, or the keep's
DHF panel]

## The arguments, which were the best part

**Words.** We wrote a glossary and threw words out of it. No mentor, no buddy,
no sponsor — a guide walks you somewhere, a mentor is a relationship, and more
people will offer to be the lighter thing. No newbie, no arrival. New user and
OG user, both meaning nothing but account age, drawn at the same line.

**Indicators, not conclusions.** Basecamp shows facts about a person. It does
not tell you what they mean. Earning on Hive and cashing out is not wrongdoing —
people are paid for their work. The behaviour is visible, everyone can see it,
and the person can speak for themselves. Curators decide. The tool does not.

**History as terrain.** The 2020 fork became the Steem Ruins: a dead grey
district opposite the Emperor's keep, and a rusted rail that runs toward the
living world and stops. The break in the rail *is* the fork. Its one link is the
real 2020 post announcing Hive. The Emperor is the ninja-mined stake; the chain
routes around him; all 21 helmets set his hoard loose and it becomes everyone's.

## What went wrong

- **The 2.5D board lean.** Built it, looked at it, pulled it out the same day. A
  squashed board reads as a playing card, not a world. What I wanted was a planet
  with sides — got that a week later.
- **Darkening the land.** An art argument said the ground was too bright. Built,
  reverted. The bright red *is* the map's identity.
- **Payouts on houses.** Dead on arrival: a house is a post from the last 30
  minutes and the world rebuilds every round, so a post can never reach its 7-day
  payout while it is on screen. Closed without building it.
- **Closure bugs, twice.** One made every community bubble unclickable; the same
  trap came back and stopped my own avatar loading onto the bug.
- **No automatic checks existed at all** until the last day of the month. The
  module's own README called that its most honest criticism, for weeks.

## For developers

| | |
|---|---|
| Period | 3 Aug – 8 Sep (37 days, 21 with commits) |
| Hours | ~100, estimated (2–3/day) |
| Commits | 101 |
| Net | 250 files, +32,768 / −809 lines |
| Tickets | 39: 26 resolved, 13 open |
| H.I.V.E.R. | 110 files, 18,003 lines |
| Basecamp | 56 files, 5,520 lines |

Last day was a split — code moved verbatim, only imports and wrappers new:

| File | Was | Now |
|---|---|---|
| `engine/icons.ts` | 3,441 lines | 26 files, biggest 424 |
| `engine/render.ts` | 2,515 lines | 22 files, biggest 315 |
| `engine/canvas-map.tsx` | 1,894 lines | 864 + 3 files |

Proved by diffing every line of the old files against the new folders, counting
every canvas call, and checking each extracted piece balances its own save and
restore. **That caught one real bug** — a doubled `ctx.restore()` that would have
unbalanced the canvas and quietly wrecked whatever drew next.

Then 30 headless checks, one command, no browser and no account: the world's
invariants (no crossing streets, no junction over four ways, 35° minimum between
them, the same round always building the same world), the movement integrator,
blocks, footprints, the keep, the 21 helmets, the DHF race line.

Fork it and run it on your own front end. That is the intent, not a courtesy —
the README lists the two external dependencies you would need to replace.

## What is not true yet

Not deployed. Not proven fun. Live players are the
goal, not a feature. The ~6,300 lines that *draw* have no automatic checks — the
type checker and my eyes, that is it. The four modes exist as a welcome and a
picker; what each holds is still open. And the code still says "newcomer" where
the glossary says "new user" — logged, not fixed.

## Next, and the ask

In order: make it actually fun, then build an SDK someone else can test.

The bar is a person named Percy. The game is a game when Percy plays it because
he wants to, not because I asked him to. Not passed yet.

What I want from you: people to argue with. Right now it is me and a couple of
friends, and that is the part most in need of changing. Fork it, break it, or
tell me a word in the glossary is wrong.
