# Learning through play, and games laid over live data

Research note for H.I.V.E.R. (Hive Frontend Universe). Written 2026-09-05.
Question: what do primary sources say about games where playing itself
teaches a real system, and games laid over real-world or live data, and what
should H.I.V.E.R. copy or avoid?

Every idea for the game in this file is a PROPOSAL. Nothing here is agreed.
Nothing here tells a player what to think about another account. The rule
from ETHOS.md holds throughout: the game shows, the person decides.

Words follow `apps/blog/features/basecamp/CONTEXT.md`: new user (account under
a year old), OG user (a year or older), curator (anyone looking at an account
and weighing it), guide, support, reply, patrol. The code still uses the
identifiers `isNewcomer`, `NEWBS` and `Newb Trail`. They are quoted here as
code names only, and the mismatch is raised in the open questions.

Source discipline: developer talks, developer blogs, the studios' own
postmortems and the original papers were preferred. Where a talk video sits
behind the GDC Vault paywall, the quote comes from a reporting outlet that was
in the room, and that is said each time. Where a page could not be opened
(expired certificate, 403, a moved blog), that is said too. Every claim
carries a URL. Section 8 lists them all.

---

## 1. Summary

1. The games that teach best never explain. They build a true system, give
   the player a goal they chose, and let failure be the teacher (Kerbal Space
   Program, Factorio, Foldit).
2. The strongest anti-guessing device is batch confirmation: the game only
   says "right" when a set of answers is right together (Return of the Obra
   Dinn). That rewards noticing, not clicking.
3. Rhythm beats volume. One shared puzzle a day (Wordle) kept people; an
   uncapped pile of daily quests burned them out (World of Warcraft, per
   Blizzard's own designer).
4. Forgiveness raises retention. Duolingo found that letting people pause a
   streak made them do more, not less.
5. Any measure that becomes a target stops measuring (Strathern's version of
   Goodhart's law). Steem lived this: bid bots took 19 percent of the 2018
   reward pool, and the chain had to change its economics to fight them.
6. Real-world reward loops get farmed the moment the reward is worth farming
   (Pokemon Go spoofing, Reddit karma). Niantic's fix was a warning ladder;
   over 90 percent stopped after the first warning.
7. H.I.V.E.R. is protected by one fact: it pays nothing on chain. Keep it so.
   Game rewards must never trigger on a chain act.
8. Motivation research agrees on three needs: competence, autonomy,
   relatedness. Tangible expected rewards undermine intrinsic interest;
   informative feedback strengthens it.
9. Ten mission proposals follow in section 6, each tied to code that exists.
10. Eleven open questions for the owner are in section 7.

---

## 2. Teaching without telling

Each section: what the source says, the rule it gives, then a paragraph
marked PROPOSAL tying it to something real in the H.I.V.E.R. code.

### 2.1 Kerbal Space Program: the system is true, so failure teaches

Kerbal Space Program (KSP) is a rocket-building game with real orbital
physics. Its developer, Squad, said in a 2013 interview that the way to learn
is to pick a goal: "When you're ready to start challenging yourself, set some
goals, like getting into orbit or to the Mun. You'll learn a lot about orbital
mechanics and rocketry along the way." They also said "We always try to aim
for keeping things realistic but at the same time, fun."
Source: Squad staff (Chad Jenkins, Bob Holtzman) interviewed by Gameranx,
6 Aug 2013.
https://gameranx.com/features/id/16605/article/kerbal-space-program-interview-behind-the-space-agency-sim/

When NASA asked Squad to add its real Asteroid Redirect Mission to the game
(2014), Squad wrote that the game "is about giving gamers the chance to dream
big, even if they're not astrophysicists" and that the NASA tie-in would
"give players a real opportunity to learn about the universe we're living in."
Source: Squad's own announcement, kerbaldevteam blog, March 2014.
https://www.tumblr.com/kerbaldevteam/78664661747/kerbal-space-program-to-add-nasa-asteroid-redirect

NASA itself later challenged KSP players to rebuild the OSIRIS-REx probe in
the game. NASA's project scientist Jason Dworkin: "Here is a community of
people that is enthusiastic about space and wants to learn the science of
spaceflight." Source: NASA Goddard, 13 Jun 2016.
https://www.nasa.gov/centers-and-facilities/goddard/gamers-tackle-virtual-asteroid-sampling-mission/

Rule: do not simplify the real thing into a lesson. Keep it true, let the
player set the goal, and let the explosion be the explanation. The lesson is
a side effect of trying.

PROPOSAL, possible H.I.V.E.R. use. The token economy in `engine/coins.ts`
already does this: tokens are minted one per thousand real `custom_json`
operations in the window (`CoinState.minted`, `CoinState.sourceOps`), so a
busy half hour visibly litters the map. The KSP rule says: do not add a
tooltip essay about what `custom_json` is. Instead let the player notice,
across two or three windows, that the token count and the particle flows on
the lines rise and fall together. The HUD can show the two numbers side by
side; the connection is the player's to make.

### 2.2 Foldit: the score is the real thing, the cues name problems, players teach players

Foldit is an online puzzle game where players fold protein shapes. The 2010
Nature paper reported that players beat the Rosetta computer method on 5 of
10 blind test cases, and did best on problems needing big rearrangements.
Design details from the paper: the interface replaced technical terms with
plain words and colour-coded the problems (exposed parts, clashes, voids);
"The introductory levels were also iteratively tuned to reduce player
attrition due to difficulty or lack of engagement"; and players specialised,
"some players specialize in early stage openings, others in middle and end
game polishing." Players had many motives: "While the purpose of
contributing to science is a motivating factor for many players, Foldit also
attracts players interested in achievement through competition and point
accumulation, social interaction through chat and web-based communication..."
Source: Cooper et al., "Predicting protein structures with a multiplayer
online game", Nature 466, 756 to 760 (2010). Open-access copy:
https://pmc.ncbi.nlm.nih.gov/articles/PMC2956414/

A 2011 follow-up let players write and share "recipes" (saved strategies).
Players made over 5,400 recipes by copying and remixing each other; two
became dominant, and those two turned out to match an unpublished method
scientists had invented at the same time. Source: Khatib et al., "Algorithm
discovery by protein folding game players", PNAS 2011, DOI
10.1073/pnas.1115898108 (abstract read via Europe PMC).
https://doi.org/10.1073/pnas.1115898108

Rule: make the score the real quantity, so there is nothing to game except
the truth. Show problems as visual cues, never as answers. Let players share
how they look, not what they concluded.

PROPOSAL, possible H.I.V.E.R. use. The house card (`card/house-card.tsx`)
shows real readouts for a post's author: stake in HP, reputation, account
age, tier, community. That is already Foldit's cue grammar: things to look
at, not verdicts. `lib/observations.ts` stores the player's own private
judgement (`'real' | 'bot' | 'unsure'`) on their device only, with transport
deliberately unbuilt. The Foldit recipe idea suggests a safe future step that
still needs the trust-model conversation first: let players share what they
looked at (a checklist of readouts), never what they decided. That keeps
ETHOS.md's "visual indicators, not conclusions" intact.

### 2.3 Papers, Please: one new rule a day, learned by doing the job

Papers, Please puts the player at a border checkpoint. Each day adds a rule;
the player learns the bureaucracy by stamping passports and paying for
mistakes. Lucas Pope, its designer, said the shape of each day is scripted:
"The general flow of the game from day to day, along with 2 or 3 immigrants
per day are all scripted." He kept exposition thin because, in his words,
"the player's imagination handles most of the heavy lifting." Moral choice
lives in ordinary buttons (detain, deny), not in dialogue menus.
Source: Lucas Pope, Road to the IGF interview, Game Developer, 2014.
https://www.gamedeveloper.com/design/road-to-the-igf-lucas-pope-s-i-papers-please-i-

Rule: add one rule at a time. Make the core verb "spot the discrepancy".
Put the moral weight in the everyday action, and let the player feel it
without a sermon.

PROPOSAL, possible H.I.V.E.R. use. Patrol (spotting bots, scammers,
spammers and blatant extractors) is Basecamp's Papers, Please. But
HANDOFF.md parks any mechanic that flags real accounts until the trust-model
conversation happens. Until then, the discrepancy verb can be trained on
things that are not people: the Steem Ruins landmark (`STEEM_RUINS` in
`lib/fixed-world.ts`) versus the living witness ring, or the player's own
card versus what they expected it to say. One new readout per window, not a
rulebook on day one.

### 2.4 Return of the Obra Dinn: confirm in batches so guessing never pays

Return of the Obra Dinn asks the player to work out how sixty sailors died.
Answers go into a book. The book only confirms answers in sets of three, so
a player cannot brute-force one name at a time. Pope's stated goal:
"My goal for Obra Dinn was to overwhelm the player initially, then give them
time to get comfortable with the core loop before relying on their internal
compulsions." He also made each scene stand alone: "I tried to make each
scene interesting on its own and not dependent on a deep understanding of
exactly what's going on from the bigger picture."
Source: Lucas Pope, Road to the IGF interview, Game Developer, 2019.
https://www.gamedeveloper.com/business/road-to-the-igf-lucas-pope-s-i-return-of-the-obra-dinn-i-

The sets-of-three rule is documented in reviews and the game's Wikipedia
entry (correct fates confirmed only in sets of three, the last six in sets
of two). Kotaku's reviewer wrote that there is enough information to figure
everything out without guessing, "but it's just enough information."
Sources: https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn and
https://kotaku.com/return-of-the-obra-dinn-the-kotaku-review-1829797772
(Chris Kohler, 18 Oct 2018). Pope's own devlog on dukope.com discusses
brute-forcing during development; the page returned 403 when fetched, so
it is listed but not quoted: https://dukope.com/devlogs/obra-dinn/

Rule: never give per-item right/wrong feedback on a deduction. Confirm a
batch. The reward then attaches to having looked, not to having clicked.

PROPOSAL, possible H.I.V.E.R. use. The `Newb Trail` quest in
`engine/canvas-map.tsx` (lines 168 to 222 and 1078 to 1090) awards one gem
when the player has parked at every house whose author is a new user
(`board.houses[n].isNewcomer`, set in `lib/board.ts` from real account age).
As built it rewards visiting, not noticing: the pink dashed trail already
tells you where to go. An Obra Dinn variant: hide the trail, ask the player
to park at the three houses they believe belong to new users, and only light
the gem when all three are right, with no feedback in between. The player
has to read the age readout on the card to win. Same data, no new fetch.

### 2.5 Duolingo: rhythm, plus forgiveness

Duolingo's streak counts consecutive days with a lesson. Their 2017 research
post reports two tests. A "Streak Wager" raised Day-7 retention by 14
percent. A "Weekend Amulet", which let a streak survive a weekend off, made
users 4 percent more likely to return a week later and 5 percent less likely
to lose their streak. Their conclusion: "By giving learners the option to
take a break, they're actually more likely to do more in the long run."
They also note that bingeing predicts quitting, so streaks "encourage
treating language learning as more of a marathon than a sprint."
Source: Kai Herng Loh, Duolingo blog, 10 May 2017.
https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/

Rule: a return rhythm helps, but only with forgiveness built in. A streak
that punishes a missed day teaches people to quit when they miss one.

PROPOSAL, possible H.I.V.E.R. use. The world already has two rhythms: the
30-minute reweave (`windowStartFor` in `lib/board.ts`) and the daily Buzzing
Station (`buzz` in `engine/canvas-map.tsx`, one landmark a day paying double
tokens). If any streak-like counter is ever added (windows visited, days
played), build the amulet in from the first version, and keep it local in
`localStorage` with `StorageTTL.PERMANENT`, the way `hfu-visited` and
`hfu-helmets` already are. No streak should ever depend on a chain act.

### 2.6 Zelda, Breath of the Wild: terrain and curiosity replace text

Nintendo's GDC 2017 talk "Change and Constant: Breaking Conventions with The
Legend of Zelda: Breath of the Wild" (Hidemaro Fujibayashi, Satoru Takizawa,
Takuhiro Dohta) is on the GDC Vault behind a paywall:
https://www.gdcvault.com/play/1024562/Change-and-Constant-Breaking-Conventions
Thumbsticks reported from the room. Fujibayashi: "What I wanted to
accomplish with this new Zelda was to create a game where the user can truly
experience freedom." On the physics-driven design he called "multiplicative
gameplay", tested first in a 2D prototype: "An active game was created where
countless different events occurred for which the user can freely create
solutions." Source (reporting the talk):
https://www.thumbsticks.com/gdc-17-breaking-conventions-breath-of-the-wild/

At CEDEC 2017 (a Japanese developer conference) Fujibayashi and lead artist
Makoto Yonezu described the "triangle rule": every obstacle is shaped like a
triangle, so the player chooses over or around, and the shape hides what is
behind it. Source (reporting the talk): Source Gaming, 25 Nov 2017,
https://sourcegaming.info/2017/11/25/holism-breath-of-the-wilds-golden-triangles/
and Game Developer's summary of both talks, 11 May 2023,
https://www.gamedeveloper.com/design/5-design-lessons-learned-from-i-the-legend-of-zelda-breath-of-the-wild-i-

On the 900 hidden Koroks, Fujibayashi wrote on the official Zelda developer
blog (25 Jun 2017) that the team first placed rocks at suspicious spots,
found that was not rewarding enough, and "Instead, we suggested hiding some
small creatures there for the finding. So that's how these Koroks...ended up
scattered across remote areas of Hyrule." Source (reporting the blog):
http://nintendoeverything.com/zelda-breath-of-the-wilds-korok-seeds-were-originally-stone-objects/

Rule: guide with shapes, not signs. Every suspicious spot must pay. The
opening area holds the whole ruleset in a small space, then the fence drops.

PROPOSAL, possible H.I.V.E.R. use. `engine/helmets.ts` already follows the
Korok rule: 21 helmets, placement fixed forever from a constant seed
(`PLACEMENT_SEED`) so "players can learn the spots, tell each other, and go
back", with a breadcrumb line of void helmets toward the keep. Keep that.
The witness citadels are the towers: drifting into one rides the light beam
to the crown, where the card opens with real chain stats (`witnessStats` in
`engine/canvas-map.tsx`, lines 324 to 339, fed by `data/fetch-witnesses.ts`:
votes in HP, HBD interest vote, price feed, account creation fee, block size
vote, year registered). Nothing on that card needs a caption. The climb is
the lesson: these 21 towers set the chain's parameters by vote.

### 2.7 Minecraft redstone: a consistent system with no goal makes its own students

Minecraft's redstone is a wiring system with simple, consistent rules and no
set task. Mojang's own education arm now teaches logic with it: the
"Redstone Basics" lesson uses a museum of six rooms explaining how redstone
works, and a "Redstone Vault" challenge built on logic gates.
Source: Minecraft Education lesson pages,
https://education.minecraft.net/en-us/lessons/redstone-basics (the page
returned 403 to a direct fetch; the description is from the site's own
search listing). This is the thinnest source in the file, and is included
only for the shape of the lesson: a museum you walk through, then a vault
you have to wire yourself.

Rule: if the rules are consistent, the community writes the textbook. The
designer's job is to keep the rules legible.

PROPOSAL, possible H.I.V.E.R. use. The JSON factories where tokens are
banked (`BANK_RANGE` logic in `engine/coins.ts`) are the natural museum.
Today banking "has no reward beyond the counter" (README, Status). A
factory could show, in plain words, what a `custom_json` operation is and
which kinds of apps write them, using only the window's real count that is
already fetched (`AmbientCounts.customJson` in `lib/board.ts`). No new
fetch, no new lore.

### 2.8 Factorio: assume the text is skipped

Factorio's team wrote three blog posts on teaching. In FFF-241 (2018) they
found their tutorial constrained players so hard that people learned to
solve the tutorial rather than the game, and set new rules: "Teaching by
experimentation instead of jumping through arbitrary tasks. Letting the
player coming up with their own solution of a puzzle."
https://factorio.com/blog/post/fff-241
In FFF-205 they named their own "expert blindness" after an office
administrator said of a whole system: "I don't know what it is, so I have
never touched it." https://www.factorio.com/blog/post/fff-205
In FFF-342 (2020) they set the hardest rule: "if the player tabbed through
all the speech bubbles without looking, and did not read the story text,
they should still be able to finish the level."
https://www.factorio.com/blog/post/fff-342

Rule: design as if nobody reads. Watch a non-expert play and write down what
they never touch.

PROPOSAL, possible H.I.V.E.R. use. HANDOFF.md names Percy as the playtester
whose verdicts drive rebuilds. Add one real new user to that loop and apply
the Factorio test: which landmarks in `LANDMARKS` (`lib/fixed-world.ts`) and
which panes of the Rose Window (`ROSE_WINDOW_PANES`) does a first-time
player never open? The `PLACES` counter (`hfu-visited`) already records
this per player; read it after a session before changing anything.

### 2.9 Koster: fun is the feeling of learning a pattern

Raph Koster's book A Theory of Fun for Game Design (2004; second edition
O'Reilly, 2013) argues that fun is the pleasure of learning a pattern, and
boredom is what follows mastery. His publisher page:
https://www.theoryoffun.com/
In his GDC Online 2012 keynote "A Theory of Fun 10 Years Later" he added the
ethical corollary. As reported by PocketGamer.biz (9 Oct 2012): "We have an
art form that rewires people's brains, and that means we have
responsibility." He defended the pattern theory: "A lot of people hate this
can be reduced to something that's mechanical, but the more science that has
come out over the past 10 years, the more this has been proven."
https://www.pocketgamer.biz/gdc-online-12-raph-kosters-thoughts-10-years-on-from-a-theory-of-fun/
Slides (large PDF): https://www.raphkoster.com/gaming/gdco12/Koster_Raph_Theory_Fun_10.pdf

Rule: a game teaches exactly what its rules reward. Choose the pattern you
want learned, then make that the thing that scores.

PROPOSAL, possible H.I.V.E.R. use. Audit each existing reward against this
rule. Tokens reward riding routes (good: routes are the site's navigation).
Helmets reward exploring the void (good: the void is where real communities
and the ruins sit). The `Newb Trail` gem rewards parking at new users' posts,
which teaches "these are the accounts with the pink trail" rather than "this
is how you tell an account's age". Section 2.4 proposes the fix.

---

## 3. Living over live data: what brings people back, what burns them

### 3.1 What brings people back

Ingress and Pokemon Go. John Hanke (Niantic) gave a GDC 2015 talk, "How
Stories Create Real Experiences: Ingress as a Narrative Platform", on Ingress
"motivating users to perform extraordinary feats and forging deep friendships
across international boundaries" (talk description).
https://gdcvault.com/play/1022050/How-Stories-Create-Real-Experiences
In Time (13 Jul 2016) he named the three goals Ingress taught them and
Pokemon Go was built around: exploration, exercise, face-to-face social
play. "We've really honed the dynamics for this type of game, the dynamics
that we built Pokemon Go around through Ingress." And: "AR enhances the
things that we do as human beings out in the real physical world. It's not
something that completely replaces them with a fantasy experience."
https://time.com/4404282/pokemon-go-john-hanke/
Lesson for a game over live data: the game's job is to make the real thing
more visible and more social, not to replace it.

Geocaching. Geocaching.com's own history: Dave Ulmer hid the first cache on
3 May 2000 with one rule, "Take some stuff, leave some stuff", and a logbook.
About 75 caches existed by September 2000; the slogan that grew the hobby was
"If you hide it, they will come."
https://www.geocaching.com/about/history.aspx
Lesson: a logbook and a reciprocity rule, no points at all, sustained a
real-world game for a quarter century. The reward is the signature.

Wordle. Josh Wardle's GDC 2022 talk was titled "Wordle: Doing the Opposite
of What You're Meant To". https://gdcvault.com/play/1027882/-Wordle-Doing-the-Opposite
Game Developer reported his words: "I just wanted a game that was just three
minutes of your time a day, and that's it." On sharing he asked himself:
"why am I encouraging people to share? Am I encouraging them because they
want to do it? Or am I encouraging because it's good for the game."
https://gamedeveloper.com/gdc2022/josh-wardle-reflects-on-the-the-unconventional-road-to-wordle-s-success
To TechCrunch (12 Jan 2022) he said: "I'm just kind of suspicious of apps and
games that want your endless attention" and "I think people have an appetite
for things that transparently don't want anything from you."
https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/
Lesson: one puzzle, the same for everyone, once a day. The sameness is what
makes it social; the scarcity is what makes it respectful.

Once-a-day games in general. Game Developer's survey of the genre (Dylan
Woodbury, 18 May 2022) names three pillars: everyone can play the same
puzzle regardless of skill, the game starts conversations, and "An essential
activity at the center of a game's design is the only way to make a game
that itself feels essential."
https://www.gamedeveloper.com/design/the-rise-of-once-a-day-games-lessons-learned-from-wordle-s-legacy

H.I.V.E.R. already has Wordle's core property. The world is deterministic
from the window start (README, Invariants): every player in the same 30
minutes sees the same world, and the Buzzing Station is picked from the UTC
day number so everyone gets the same pick. That is the shared puzzle. It
should be protected as carefully as `movement.ts`.

### 3.2 What burns people out

World of Warcraft daily quests. Blizzard's Tom Chilton, on why the game
stepped back from dailies (PCGamesN, 17 Aug 2017): "That really caused a lot
of burnout." And: "Burning Crusade had the advantage of having the 10 daily
quest cap. I don't think we can underestimate how much that helped players
not burn out." Removing the cap in Mists of Pandaria overwhelmed players.
https://www.pcgamesn.com/wow/why-world-warcraft-leaving-daily-quests-behind-they-really-caused-lot-burnout
Lesson: cap the daily list. A short list you can finish beats a long list you
feel you owe.

World of Warcraft quest design mistakes. Jeff Kaplan's GDC 2009 talk, as
reported by Game Developer, named the "Christmas tree" quest hub (too many
quests at once), too much quest text ("Don't be precious about your
writing"), bad drop rates, and this rule: "The mystery should never be in
the action that the player needs to do."
https://www.gamedeveloper.com/pc/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes
Lesson: the mystery can be in the world. It must never be in what the button
does.

Dark patterns. Zagal, Bjork and Lewis (FDG 2013) defined a dark game design
pattern as one "used intentionally by a game creator to cause negative
experiences for players which are against their best interests and likely to
happen without their consent", and named grinding, playing by appointment
(you must log in at a set time or lose out), pay to skip, and social pyramid
schemes. The original PDF is at
http://www.fdg2013.org/program/papers/paper06_zagal_etal.pdf (the site's
certificate had expired when checked). The definition above is quoted from
Deterding, Stenros and Montola, "Against Dark Game Design Patterns", DiGRA
2020, who restate it in order to criticise it:
https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf
Lesson: "playing by appointment" is the trap closest to H.I.V.E.R. A
30-minute reweave that made you lose something if you were not there would
be exactly that pattern. Today nothing is lost between windows except
unbanked tokens; keep it that way.

Duolingo's own caveat (section 2.5) belongs here too: bingeing predicts
quitting, and a streak with no forgiveness punishes life.

---

## 4. Keeping it honest

### 4.1 The law

Marilyn Strathern (1997): "When a measure becomes a target, it ceases to be
a good measure." European Review 5(3), 305 to 321, at p. 308.
https://gwern.net/doc/statistics/decision/1997-strathern.pdf
Every readout on a card is a measure. The moment the game pays for one, it
stops meaning what it meant.

### 4.2 Steem's bid-bot era, in its own documents

A bid bot sold upvotes: send it tokens, it votes your post. Matt Rosen
(@yabapmatt) launched Steem Bot Tracker on 5 Oct 2017 to show which bots were
under-bid and worth paying:
https://steemit.com/utopian-io/@yabapmatt/steem-bot-tracker-new-bot-indicator-info-and-more
By 28 Jun 2018 witness @themarkymark found 11.1 percent of all Steem Power
delegated to bid bots (figure as recorded on the Steem Center wiki page
"Upvotes Bots", https://www.steem.center/index.php?title=Upvotes_Bots, which
returned 404 when fetched; the number appears in its search listing).
Paula G's data analysis found bid bots took 19.1 percent of all rewards
claimed in 2018, across 85 or more bots:
https://hive.blog/utopian-io/@paulag/bidbot-income-analysis-shows-bid-bots-earned-19-of-the-rewards-pool-in-2018

Steemit Inc's own diagnosis (May 2019): "People generally gravitate towards
what is the most profitable thing for them to do when there is monetary
incentive." Their fix was economic, not moral: a curve that pays
concentrated votes more, a 50/50 author/curator split, and a free downvote
pool. "We cannot eliminate such behavior entirely, but we can make it less
economically viable."
https://hive.blog/steem/@steemitblog/improving-the-economics-of-steem-a-community-proposal
The follow-up promised: "Under these changes self-voting and bidbot usage
will become less profitable than curating good content."
https://hive.blog/steem/@steemitblog/hf21-sps-and-eip-explained
A user's post the week after HF21 saw bid bots earning more curation than
before: "From a business case HF21 is a very lucrative outcome for them, but
from a social and 'quality curation' standpoint it is a destructive change."
https://hive.blog/whatthefork/@bmj/higher-curation-rewards-already-flowing-in-post-hf21-bid-bots-scoring-even-bigger
Seven months later the community forked to Hive (18 Mar 2020) to escape a
different problem, the ninja-mined stake; this is the post the Steem Ruins
landmark links to:
https://hive.blog/communityfork/@hiveio/announcing-the-launch-of-hive-blockchain

Lesson: when a click is worth money, people build machines to click. No
amount of rule-writing beats the arithmetic; only changing what pays does.

### 4.3 Pokemon Go: real-world reward, spoofed location

Niantic's Three-Strike Discipline Policy (July 2018) defines cheating as
"Spoofing (making the game think you're somewhere you're not), using
modified Pokemon GO clients or bots or doing something that accesses Pokemon
GO's backend in an unauthorized way." First strike: a warning and seven days
without rare finds. Second: a month's suspension. Third: permanent.
Source: TechCrunch quoting the policy, 20 Jul 2018,
https://techcrunch.com/2018/07/20/niantic-explains-how-and-why-it-bans-players-in-pokemon-go
Policy page: https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/39-three-strike-discipline-policy/
(returned 403 when fetched).
Niantic's 2021 update reported over 5 million cheaters punished in 2020,
over 20 percent permanently, and that over 90 percent of those warned once
stopped. Source: Pokemon GO Hub reporting Niantic's post,
https://pokemongohub.net/post/news/niantic-shares-insights-into-anti-cheat-efforts-5-million-spoofers-banned-in-2020/
Niantic's original (https://nianticlabs.com/news/cheatingupdate-022321) now
redirects to a page that returns 404; Niantic's news archive moved in 2025.
In 2016 Niantic also cut off third-party map scrapers, saying they were
"interfering with our ability to maintain quality of service for our users"
(statement quoted by TechCrunch, 2 Aug 2016):
https://techcrunch.com/2016/08/02/niantic-explains-why-it-killed-third-party-pokemon-go-tracking-services/

Lesson: a warning ladder works on most people. Also: a game over live data
attracts scrapers as soon as knowing the data early is worth something.

### 4.4 Reddit karma

Reddit's help centre defines karma as a reflection of upvotes received and
prohibits "creating and employing multiple accounts, voting services, or any
automation to manipulate vote counts", and coordinated voting.
Pages: https://support.reddithelp.com/hc/en-us/articles/204511829-What-is-karma
and https://support.reddithelp.com/hc/en-us/articles/360043066412-Disrupting-Communities
Both returned 403 to a direct fetch; wording is from the pages' search
listings. Karma farming (reposting and bait for points) is legal on Reddit
and endemic, which is the point: a number that unlocks things gets farmed
even when it pays no money.

### 4.5 Rewards and interest

Deci, Koestner and Ryan's 1999 meta-analysis of 128 experiments:
engagement-contingent, completion-contingent and performance-contingent
tangible rewards "significantly undermined free-choice intrinsic
motivation" (effect sizes d = -0.40, -0.36, -0.28), while "Positive feedback
enhanced both free-choice behavior (d = 0.33) and self-reported interest."
Psychological Bulletin 125(6), 627 to 668.
https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf
Lesson: paying people to do a thing they already liked makes them like it
less. Telling them clearly how they did makes them like it more.

### 4.6 Which of this applies to a game that only reads the chain

H.I.V.E.R. broadcasts nothing (README, Invariants; HANDOFF, Hard rules). So:

- Bid-bot farming cannot happen inside the game. Tokens, gems and helmets
  buy nothing on chain and are stored on the player's device.
- The Steem failure mode returns the moment a game reward triggers on a
  chain act. "Vote on three new users' posts to earn a gem" is a bid bot
  with a cute face. HANDOFF's rule already forbids it: the human acts in
  their own hands, never for the game.
- Goodhart applies to the card. If a mission ever pays for a readout (post
  count, follower count, reply count), that readout will be farmed by the
  accounts Basecamp exists to expose. Missions should pay for looking at a
  readout, never for moving one.
- Appearing on the map is itself a reward. Real posts from the last 30
  minutes become houses; new users' houses get the pink trail. That is
  already true of every trending page and is acceptable, but it means the
  game must never rank houses by a farmable number.
- Scraping: the game reads public APIs that are already public. Nothing to
  protect.
- Reddit's lesson: a local counter with status (PLACES, NEWBS, helmets) is
  still gameable if it is ever shown to others. Today it is private. If a
  leaderboard is ever proposed, it needs this section read first.

Countermeasures that fit, all from the sources above:

1. Reward noticing, not clicking: batch confirmation (Obra Dinn), discrepancy
   spotting (Papers, Please), a score that is the real quantity (Foldit).
2. Keep every reward cosmetic and local (geocaching's logbook).
3. Same world for everyone in the window (Wordle) so nobody can buy a better
   puzzle.
4. Forgiveness on any rhythm (Duolingo), a cap on any daily list (Chilton).
5. Informative feedback over tangible prizes (Deci, Koestner, Ryan).
6. A warning ladder before any exclusion, if in-game moderation is ever
   needed (Niantic).

---

## 5. Motivation, briefly

Self-Determination Theory (SDT) says people are pulled toward activities
that satisfy three needs: competence (feeling effective), autonomy (feeling
the choice is yours), relatedness (feeling connected). Ryan, Rigby and
Przybylski tested this on games in four studies. Their abstract: perceived
in-game autonomy and competence "are associated with game enjoyment,
preferences, and changes in well-being", and in a survey of online
multiplayer gamers all three needs "independently predict enjoyment and
future game play." From the discussion: "intuitive controls appear to
enhance game enjoyment and preferences by facilitating players' experiences
of in-game competence." A desire for power and mastery scores (Yee's
"achievement" motive) was negatively related to mood after play.
Source: Ryan, Rigby and Przybylski, "The Motivational Pull of Video Games: A
Self-Determination Theory Approach", Motivation and Emotion (2006), DOI
10.1007/s11031-006-9051-8. Author copy:
https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf

Their 2010 review adds two design points: "skill-graded challenges and
positive feedback are key to player experiences of competence need
satisfaction", and autonomy comes from "equifinality (multiple routes to an
end)". Source: Przybylski, Rigby and Ryan, "A Motivational Model of Video
Game Engagement", Review of General Psychology 14(2), 154 to 166 (2010).
https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf

Flow (Csikszentmihalyi) is the state of full absorption. Its conditions, from
Nakamura and Csikszentmihalyi (2002): "Perceived challenges, or opportunities
for action, that stretch (neither overmatching nor underutilizing) existing
skills" and "Clear proximal goals and immediate feedback about the progress
that is being made." The balance is fragile: "If challenges begin to exceed
skills, one first becomes vigilant and then anxious; if skills begin to
exceed challenges, one first relaxes and then becomes bored."
Source: "The Concept of Flow", in Handbook of Positive Psychology (Oxford,
2002), 89 to 105. https://nuovoeutile.it/wp-content/uploads/2015/12/2002-Flow.pdf
Book: Csikszentmihalyi, Flow: The Psychology of Optimal Experience (Harper
and Row, 1990).

Lazzaro's four keys (2004). Nicole Lazzaro's XEODesign watched 30 adults play
for 90 to 120 minutes each and sorted the emotions into four keys: Hard Fun
(challenge, ending in the triumph she calls fiero), Easy Fun (curiosity and
wonder), Altered States (changing how you feel), and The People Factor
(playing with and against others). Paper:
https://xeodesign.com/xeodesign_whyweplaygames.pdf
The site's certificate had expired when checked, so the paper itself was not
opened; the summary above is from its indexed abstract. Treat the "top games
use at least three keys" claim often attributed to it as unverified here.

Koster (section 2.9): fun is learning; boredom is a mastered pattern.

What this means for H.I.V.E.R. in one paragraph: competence comes from the
rails and the jump being learnable in a minute (intuitive controls); autonomy
comes from "choose your own adventure" (HANDOFF) and many routes to any
place; relatedness is the one need the game does not yet serve, because
every real person on the map is a link, not a presence. Lazzaro's Easy Fun
(curiosity) is the game's strongest key today; Hard Fun exists in the
helmet ladder; People Fun is parked with live encounters. Flow says the
30-minute reweave is the right pacing device: a fresh, same-sized challenge
each window, never a bigger one.

---

## 6. Ten mission ideas (all PROPOSAL)

Each: the real Hive thing it teaches; the play action; what the player
learns without being told; the source pattern; the code it touches. None
writes to the chain. None renders a verdict on an account.

1. PROPOSAL: Three under a year.
   Teaches: account age is a public fact anyone can read.
   Action: with the pink trail hidden, park at the three houses you believe
   belong to new users; the gem lights only when all three are right.
   Learned: where the age readout is on a card, and that a young account is
   just a young account.
   Pattern: Obra Dinn batch confirmation.
   Code: `isNewcomer` in `lib/board.ts`; `visitedNewbsRef` and the gem award
   in `engine/canvas-map.tsx`.

2. PROPOSAL: The twenty-one thrones.
   Teaches: witnesses set chain parameters by vote.
   Action: ride the beam on any two citadels and compare the HBD interest
   line on their cards; the mission completes when you have opened two cards
   that disagree.
   Learned: the 15 percent (or whatever it is today) is not a law of nature.
   It is 21 people voting.
   Pattern: Zelda towers; KSP "set a goal, learn on the way".
   Code: `hbdApr`, `creationFee`, `blockSize` in `data/fetch-witnesses.ts`;
   `witnessStats` in `engine/canvas-map.tsx`.

3. PROPOSAL: Rank walk.
   Teaches: the witness ring is live and in vote order.
   Action: the travel map marks which citadels changed rank since your last
   visit (data is cached an hour under `hfu-witnesses-v3`); visit one.
   Learned: witness votes move, and yours would move them.
   Pattern: geocaching's "go back and see what changed"; Foldit's live score.
   Code: `rank` in `TopWitness`; `witnessPosts` in `lib/fixed-world.ts`.

4. PROPOSAL: Busy hour.
   Teaches: `custom_json` operations are what apps and games write.
   Action: bank tokens at a JSON factory; the factory shows this window's
   real operation count next to the number minted.
   Learned: a busy Hive is a token-rich map; the map is a chain gauge.
   Pattern: Foldit's real score; Minecraft's museum then vault.
   Code: `minted`, `sourceOps` in `engine/coins.ts`; `AmbientCounts` in
   `lib/board.ts`.

5. PROPOSAL: The ruins receipt.
   Teaches: the 2020 fork, from the primary document.
   Action: reach the Steem Ruins, open the one link, then find the Emperor's
   keep on the far side of the world; the PLACES counter marks both.
   Learned: the geography is the history. The rusted rail that stops is the
   fork.
   Pattern: Zelda environmental storytelling; geocaching's logbook.
   Code: `STEEM_RUINS.url` in `lib/fixed-world.ts`; `hfu-visited`.

6. PROPOSAL: Shared voter lines.
   Teaches: curation links people; a vote is a thread between two posts.
   Action: some rails between houses are REAL (two posts share a voter) and
   some are filler; ride a real one end to end and open both posts.
   Learned: who curates you connects you to who else they curate.
   Pattern: Ingress portals and links; Kaplan's "mystery in the world, not
   the button".
   Code: real versus filler edges in `lib/board.ts`.

7. PROPOSAL: Community moorings.
   Teaches: communities are places with real feeds.
   Action: visit any community bubble in the dark water and open its feed;
   bubbles light up on visit (dim-until-visited grammar already exists).
   Learned: there are rooms on Hive, not just a river.
   Pattern: Zelda's "suspicious spot must pay"; Koroks.
   Code: `COMMUNITY_SPOTS` in `lib/fixed-world.ts`; `data/fetch-communities.ts`.
   Constraint: HANDOFF says nothing may depend on community tooling. This
   only opens the public feed page.

8. PROPOSAL: The buzzing station, daily.
   Teaches: one real page of hive.blog a day, the same for everyone.
   Action: find today's humming landmark and open its real page.
   Learned: the whole site, one room a day, in the order the calendar picks.
   Pattern: Wordle's shared daily puzzle; Chilton's cap of one.
   Code: `buzz` in `engine/canvas-map.tsx`; the note line in
   `card/landmark-panel.tsx`.

9. PROPOSAL: Arrival, not action.
   Teaches: support means an upvote or a reply, and both are yours to give.
   Action: any mission ending at a real post opens the post; the game
   rewards arrival and reading time only, never the vote or reply.
   Learned: the game brought you to the door; what you do inside is yours.
   Pattern: the Steem bid-bot lesson in reverse; Deci's "rewards undermine".
   Code: the Open buttons in `card/house-card.tsx`; the "nothing broadcasts"
   invariant.

10. PROPOSAL: Your own card.
    Teaches: what a curator sees when they look at you.
    Action: the HUD offers "show me my house": if you posted in this window
    your house is highlighted; if not, a ghost card shows what yours would
    read (age, HP, reputation) using the same fields.
    Learned: the card is symmetrical; the readouts you read on others are
    the readouts others read on you.
    Pattern: Papers, Please (learn the rules by being inspected);
    CONTEXT.md's own definition of "card".
    Code: `playerHandle` in `engine/canvas-map.tsx`; `BoardHouse` fields in
    `lib/board.ts`. Would need one `get_accounts` call for the player, which
    the sign-in gate already makes possible.

---

## 7. Open questions for the owner

1. Should the pink `Newb Trail` stay visible (a guided tour) or be hidden
   behind the batch-confirm mission in 6.1 (a noticing test), or both by
   player choice?
2. The code says `isNewcomer`, `NEWBS` and `NEWCOMER`; the glossary says
   "new user": rename the code and the HUD label, or leave the code and fix
   only the visible string?
3. Is any mission allowed to pay for looking at a readout (age, HP) given
   that the readout could still become a target once players compare notes?
4. Do you want any streak or return counter at all, given Duolingo's
   evidence that it works and the dark-pattern risk of "playing by
   appointment"?
5. If a counter exists, should it ever be visible to other players, or stay
   on the device forever?
6. Should the witness card show the top witness's parameter votes next to
   each citadel's, so disagreement is visible at a glance, or is that one
   step toward the game "telling" people something about witnesses?
7. Is the Steem Ruins the right place for the first patrol training
   (spotting discrepancies on something that is not a living person), or is
   patrol parked entirely until the trust-model conversation?
8. Should the JSON factories become the museum (plain-words explanation of
   `custom_json` and app activity), or must banking stay purely mechanical?
9. Would you accept one `get_accounts` fetch for the signed-in player to
   power "your own card", or is any per-player fetch out of scope for now?
10. Who is the one real new user to add to Percy's playtest loop, and can we
    log which landmarks they never open before changing anything?
11. Relatedness is the one motivation need the game cannot yet serve without
    live encounters (parked): is the plan still to wait, or is a read-only
    "others in this window" count acceptable as a first step?

---

## 8. Sources

Format: what it is, then URL, then fetch status if not fully read.

Teaching by play
- Squad (KSP) interview, Gameranx, 6 Aug 2013.
  https://gameranx.com/features/id/16605/article/kerbal-space-program-interview-behind-the-space-agency-sim/
- Squad, NASA Asteroid Redirect Mission announcement, Mar 2014.
  https://www.tumblr.com/kerbaldevteam/78664661747/kerbal-space-program-to-add-nasa-asteroid-redirect
- NASA Goddard, "Gamers Tackle Virtual Asteroid Sampling Mission", 13 Jun 2016.
  https://www.nasa.gov/centers-and-facilities/goddard/gamers-tackle-virtual-asteroid-sampling-mission/
- Cooper et al., Foldit, Nature 466 (2010), open-access copy.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC2956414/
- Khatib et al., Foldit recipes, PNAS 2011 (abstract via Europe PMC).
  https://doi.org/10.1073/pnas.1115898108
- Lucas Pope, Papers, Please, Road to the IGF, Game Developer 2014.
  https://www.gamedeveloper.com/design/road-to-the-igf-lucas-pope-s-i-papers-please-i-
- Lucas Pope, Return of the Obra Dinn, Road to the IGF, Game Developer 2019.
  https://www.gamedeveloper.com/business/road-to-the-igf-lucas-pope-s-i-return-of-the-obra-dinn-i-
- Lucas Pope, Obra Dinn devlogs. https://dukope.com/devlogs/obra-dinn/ (403 when fetched)
- Return of the Obra Dinn, Wikipedia (sets-of-three rule).
  https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn
- Chris Kohler, Obra Dinn review, Kotaku, 18 Oct 2018.
  https://kotaku.com/return-of-the-obra-dinn-the-kotaku-review-1829797772
- Duolingo, "How Streaks keep Duolingo learners committed", 10 May 2017.
  https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
- Nintendo, GDC 2017 "Change and Constant", GDC Vault (paywalled video).
  https://www.gdcvault.com/play/1024562/Change-and-Constant-Breaking-Conventions
- Thumbsticks report of the GDC 2017 talk.
  https://www.thumbsticks.com/gdc-17-breaking-conventions-breath-of-the-wild/
- Source Gaming on the CEDEC 2017 triangle rule, 25 Nov 2017.
  https://sourcegaming.info/2017/11/25/holism-breath-of-the-wilds-golden-triangles/
- Game Developer, "5 design lessons learned from Breath of the Wild", 11 May 2023.
  https://www.gamedeveloper.com/design/5-design-lessons-learned-from-i-the-legend-of-zelda-breath-of-the-wild-i-
- Nintendo Everything reporting Fujibayashi's Zelda.com developer blog, 25 Jun 2017.
  http://nintendoeverything.com/zelda-breath-of-the-wilds-korok-seeds-were-originally-stone-objects/
- Minecraft Education, "Redstone Basics" lesson.
  https://education.minecraft.net/en-us/lessons/redstone-basics (403 when fetched)
- Factorio FFF-241, New player experience. https://factorio.com/blog/post/fff-241
- Factorio FFF-205, Teaching the things that everybody knows. https://www.factorio.com/blog/post/fff-205
- Factorio FFF-342, The new old tutorial. https://www.factorio.com/blog/post/fff-342
- Raph Koster, A Theory of Fun for Game Design (2004; O'Reilly 2013). https://www.theoryoffun.com/
- Raph Koster, "A Theory of Fun 10 Years Later", GDC Online 2012, slides.
  https://www.raphkoster.com/gaming/gdco12/Koster_Raph_Theory_Fun_10.pdf (too large to fetch)
- PocketGamer.biz report of that keynote, 9 Oct 2012.
  https://www.pocketgamer.biz/gdc-online-12-raph-kosters-thoughts-10-years-on-from-a-theory-of-fun/

Live data and real-world games
- John Hanke, GDC 2015, "How Stories Create Real Experiences: Ingress as a Narrative Platform".
  https://gdcvault.com/play/1022050/How-Stories-Create-Real-Experiences
- John Hanke interview, Time, 13 Jul 2016. https://time.com/4404282/pokemon-go-john-hanke/
- Niantic statement on third-party trackers, quoted by TechCrunch, 2 Aug 2016.
  https://techcrunch.com/2016/08/02/niantic-explains-why-it-killed-third-party-pokemon-go-tracking-services/
- Geocaching.com, history page. https://www.geocaching.com/about/history.aspx
- Josh Wardle, GDC 2022, "Wordle: Doing the Opposite of What You're Meant To".
  https://gdcvault.com/play/1027882/-Wordle-Doing-the-Opposite
- Game Developer report of Wardle's talk, Mar 2022.
  https://gamedeveloper.com/gdc2022/josh-wardle-reflects-on-the-the-unconventional-road-to-wordle-s-success
- Josh Wardle interview, TechCrunch, 12 Jan 2022.
  https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/
- Dylan Woodbury, "The rise of once-a-day games", Game Developer, 18 May 2022.
  https://www.gamedeveloper.com/design/the-rise-of-once-a-day-games-lessons-learned-from-wordle-s-legacy
- Tom Chilton on daily quests, PCGamesN, 17 Aug 2017.
  https://www.pcgamesn.com/wow/why-world-warcraft-leaving-daily-quests-behind-they-really-caused-lot-burnout
- Jeff Kaplan, GDC 2009, reported by Game Developer.
  https://www.gamedeveloper.com/pc/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes
- Zagal, Bjork, Lewis, "Dark Patterns in the Design of Games", FDG 2013.
  http://www.fdg2013.org/program/papers/paper06_zagal_etal.pdf (certificate expired when checked)
- Deterding, Stenros, Montola, "Against Dark Game Design Patterns", DiGRA 2020 (quotes the definition).
  https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf

Keeping it honest
- Marilyn Strathern, "Improving ratings", European Review 5(3) 1997.
  https://gwern.net/doc/statistics/decision/1997-strathern.pdf
- @yabapmatt, Steem Bot Tracker launch, Oct 2017.
  https://steemit.com/utopian-io/@yabapmatt/steem-bot-tracker-new-bot-indicator-info-and-more
- Steem Center wiki, "Upvotes Bots" (themarkymark's 11.1 percent figure).
  https://www.steem.center/index.php?title=Upvotes_Bots (404 when fetched)
- @paulag, "Bidbot Income Analysis shows bid bots earned 19% of the Rewards Pool in 2018", Dec 2018.
  https://hive.blog/utopian-io/@paulag/bidbot-income-analysis-shows-bid-bots-earned-19-of-the-rewards-pool-in-2018
- @steemitblog, "Improving the Economics of Steem: A Community Proposal", May 2019.
  https://hive.blog/steem/@steemitblog/improving-the-economics-of-steem-a-community-proposal
- @steemitblog, "HF21: SPS and EIP Explained", 2019.
  https://hive.blog/steem/@steemitblog/hf21-sps-and-eip-explained
- @bmj, post-HF21 observation, Aug 2019.
  https://hive.blog/whatthefork/@bmj/higher-curation-rewards-already-flowing-in-post-hf21-bid-bots-scoring-even-bigger
- @hiveio, "Announcing the Launch of Hive Blockchain", 18 Mar 2020.
  https://hive.blog/communityfork/@hiveio/announcing-the-launch-of-hive-blockchain
- Niantic Three-Strike Discipline Policy, quoted by TechCrunch, 20 Jul 2018.
  https://techcrunch.com/2018/07/20/niantic-explains-how-and-why-it-bans-players-in-pokemon-go
- Niantic policy page. https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/39-three-strike-discipline-policy/ (403 when fetched)
- Niantic 2021 anti-cheat update, reported by Pokemon GO Hub.
  https://pokemongohub.net/post/news/niantic-shares-insights-into-anti-cheat-efforts-5-million-spoofers-banned-in-2020/
  Original https://nianticlabs.com/news/cheatingupdate-022321 (redirects to a 404)
- Reddit Help, "What is karma?" https://support.reddithelp.com/hc/en-us/articles/204511829-What-is-karma (403 when fetched)
- Reddit Help, "Disrupting Communities". https://support.reddithelp.com/hc/en-us/articles/360043066412-Disrupting-Communities (403 when fetched)
- Deci, Koestner, Ryan, meta-analysis, Psychological Bulletin 125(6) 1999.
  https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf

Motivation
- Ryan, Rigby, Przybylski, "The Motivational Pull of Video Games", Motivation and Emotion 2006.
  https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf
- Przybylski, Rigby, Ryan, "A Motivational Model of Video Game Engagement", Review of General Psychology 2010.
  https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf
- Nakamura and Csikszentmihalyi, "The Concept of Flow", 2002.
  https://nuovoeutile.it/wp-content/uploads/2015/12/2002-Flow.pdf
- Nicole Lazzaro, "Why We Play Games: Four Keys to More Emotion Without Story", 2004.
  https://xeodesign.com/xeodesign_whyweplaygames.pdf (certificate expired when checked)

Project documents read in full
- apps/blog/features/hive-frontend-universe/README.md
- apps/blog/features/hive-frontend-universe/HANDOFF.md, lines 20 to 140
- apps/blog/features/basecamp/ETHOS.md
- apps/blog/features/basecamp/CONTEXT.md
- Code consulted: engine/canvas-map.tsx, engine/coins.ts, engine/helmets.ts,
  engine/gems.ts, engine/hazards.ts, lib/board.ts, lib/fixed-world.ts,
  lib/observations.ts, lib/targets.ts, lib/strings.ts, card/house-card.tsx,
  card/landmark-panel.tsx, data/fetch-witnesses.ts
