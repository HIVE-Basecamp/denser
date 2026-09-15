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

## Comments

Bryan, 2026-09-14: "this change that you made to the adventure mode now shows
all of the, like, instructions on the same front page. I think that if you
click adventure mode, that is when you should see those instructions. I do
not believe that those instructions should be on that first page. It should
be that you click, and then maybe you get the instructions... any of those
instructions should be if you click adventure mode, not just sitting there
taking up real estate and is like, you shouldn't see those words unless you
click adventure."

Built 2026-09-14. The welcome is now two steps, for adventure only.

Step one is unchanged apart from the goal list being gone: title, round
clock, four mode buttons, nothing about goals visible. Explore, curation and
front end still start on one click, exactly as before.

Clicking Adventure no longer starts the round. It swaps the panel to step
two: an "Adventure" heading, the five goals with progress (the same list as
before, just moved), a "Start adventure" button that calls the existing
`onPick('adventure')`, and a "Change mode" button that goes back to the four
modes without starting anything.

Files: `card/welcome-room.tsx` rewritten (added `AdventureGoalsStep`, a
`showAdventureGoals` state, kept `GoalList`). One new string,
`hive_frontend_universe.modes.adventure_start` ("Start adventure"), added to
all nine locale files with real translations. The back button reuses the
existing `modes.change` string ("Change mode") rather than adding another
key, since it does the same job as the mode-chip's reopen button.

Did not build: the chooser for which single challenge to attempt. Bryan
raised it in the same message and then said to leave it — "even if you don't
wanna do that part because maybe it's not clarified well enough yet." Step
two still shows all five goals together, no per-goal picker.

Checked: type-check clean, 34 headless checks pass, lint clean on the
changed file, translation lint clean for these keys. Played by hand in the
browser: welcome shows four modes and no goal text; clicking Adventure shows
the goals with Start and Change mode buttons; Change mode returns to the
four modes; Start adventure actually starts the round (mode chip reads
"Adventure", HUD shows the THIS ROUND block).
