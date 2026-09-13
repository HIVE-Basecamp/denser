# What you are doing in adventure mode

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-12: "ADVENTURE MODE HAS NO VISIBLE POINT. Explore mode is fine.
In adventure mode it is not clear what the game is or what you are meant to do;
I picked it and still did not know. We talked about challenges, like visiting
all the new posts and voting or leaving a comment. Build a first version of a
clear, always-visible 'what you are doing this round' for adventure mode: the
goals at the welcome and in the HUD with progress (the DHF race, the newb
trail, helmets, the keep already have counters), plus the new-posts challenge:
visited every new post AND voted or replied on it. The game never writes to the
chain; it READS whether I voted or replied."

Related: tickets 16, 24, 32, 33 — all still open grillings. This does not
answer them; it is a first version that can be argued with.

## Answer

Built 2026-09-12. Not committed. Not yet looked at in the browser.

Adventure mode now states its job, in two places, and both show live progress.

**At the welcome.** Under the Adventure button there is a panel headed "What
you are doing this round", listing the five goals in plain sentences with a
tick and a count each. You read what the mode is before you pick it, instead of
picking it and wondering.

**In the HUD.** A block headed THIS ROUND sits under the rest of the corner
readouts, on screen the whole time, one short line per goal with its count. A
finished goal turns green and gets a tick. It only appears in adventure mode.
The old separate NEWBS and VOTES lines are hidden while the block is up, so
nothing is counted twice in the corner.

**The five goals.** Four of them just name counters that already existed: the
newb trail, the DHF race, the 21 helmets, and the keep. The fifth is new.

**The new-posts challenge.** Meet every post on the board this round: park at
its house AND have voted on it or replied to it. Both halves are needed, and
they are different kinds of thing — parking is something the game knows,
voting and replying are things you do on hive.blog.

The game does not do them for you and never will: it reads. The marks start
from the board's own voter lists, so a post you had already voted on counts the
moment the round builds. After that, parking at a house asks the chain again —
one `get_active_votes` call and one replies call, at most once every eight
seconds per post, never for a post already marked — because you may have just
gone and voted in another tab and come back. Nothing is written, nothing is
signed.

New code, deliberately small and separate:
- `lib/goals.ts` — what the round asks of you, as data. DOM-free.
- `engine/post-marks.ts` — the challenge's state: visited, marked, when each
  post was last asked about.
- `data/fetch-my-mark.ts` — the one question, asked of Hive. Read only.
- `card/welcome-room.tsx` and `engine/render/hud.ts` show them.
- Twelve new strings, in all nine locales.

Also fixed while here: `postHref` took an author and a permlink it no longer
used (ticket 42 had stopped using them); now it takes just the url.

Checked: type-check clean, lint clean on every file touched, 34 headless checks
pass. Not yet played by hand — the goals block and the welcome panel have not
been looked at on screen.

Judgement calls for Bryan:

- "Every new post" is read as every post house on the board this round, not
  only the new users' ones — the newb trail is already its own separate goal.
  Say if you meant the other thing.
- Nothing happens yet when a goal is finished except the tick turning green.
  No reward, no phase, no lock-in. That is ticket 24's question and this does
  not pre-empt it.
- Five goals may be too many to read at a glance. It would be easy to show
  only the two or three you have not finished.
- The welcome's counts are a snapshot from the moment it opens; the HUD's are
  live every frame.
- Explore mode is untouched, as you said it should be. Curation and front end
  get no goals either — curation's are ticket 32's question.
