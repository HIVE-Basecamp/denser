# Basecamp devlog, month one: a year of talking about the front door, a month of building it

*3 August to 8 September 2026. Where it came from, what got built, what broke, and the numbers for the devs.*

## Where this actually started

Not in August. Every Tuesday since March of last year I have sat in the Hive Discord with @shadowspub and @meno hosting Hive Thrive, seventy-odd shows now. Witnesses, devs, curators, old timers, new builders. A different guest every week, and somehow the same two problems keep landing on the table.

We can't keep new people. And we don't get that many new people to begin with.

Everyone has a piece of the answer. @demotruk came on in May with a pile of chain data and a campaign called upvote a newbie. @pharesim came on and we argued about where onboarding ends and extraction begins. @sagarkothari88 talked about pitching Hive in a country where the word crypto means scam. Web of trust, proof of human, the reward myth, algorithms, a rebrand... all of it good talk. Hive Thrive is built for the talk. But I sat there week after week hearing the same diagnosis from smart people and I got itchy. I'm wired a certain way, my brain wants to fix stuff.

So here is what a year of listening boiled down to for me.

**Signing up is not the problem anymore.** It used to be brutal. Now there are half a dozen easy ways in. Not perfect, but that door works.

**The next room is empty.** You get your account, you write your intro post, and... nothing. No idea what to do, where to go, who to talk to, how to behave. Hive has a hundred little details and from the inside on day one it looks like a wall. You post a few times into silence and you leave. I have been calling that feeling the void for years. A big empty wilderness and you are alone in it.

**And the void is not just a feeling, it's in the data.** @demotruk ran the numbers across every account ever made on this chain. [His post is here](https://peakd.com/@demotruk/the-platform-got-quiet-and-quiet-kills-newcomers) and it is worth your time.

| Your first post got... | Still here at 90 days | Still here at one year |
|---|---|---|
| no reply at all | 27% | 5% |
| a reply from a human | 37% | 9% |
| a human and a bot both | 56% | 18% |

In 2017 four out of five new people got a reply to their first post, usually inside ten minutes. By 2024 it was under half, and the typical wait was over two and a half hours. Silence is the strongest predictor of leaving. The first two or three human replies do most of the work.

And the scale of it. Hive makes [around fifty thousand new accounts a year](https://peakd.com/@dalz/happy-new-year-hivers-with-a-hive-data-card-for-2025). At the worst of it, end of 2024, [only one in six new authors posted again the following month](https://peakd.com/@demotruk/hive-new-user-retention-took-a-severe-dip-in-2024). Five out of six, gone before anyone said hello.

**Meanwhile the people who could end that silence are hiding.** Plenty of OG users would happily reply, vote, show someone around. They don't, and I get why. Finding a real new person means trawling the feeds, and on any given day there are probably more bullshit accounts than real ones. Bots, sock puppets, farms, people who joined only to siphon. Hivewatchers once mapped [a single botnet of eighteen thousand accounts](https://peakd.com/@hivewatchers/advice-on-how-to-recognise-accounts-from-the-largest-botnet), all made the same way, all reputation 25, no avatar, and real people were still voting for them. You go looking to help and you spend an hour sorting garbage, so you go back to your own circle and stay there.

So two problems, and they feed each other. It is not that easy to find a new user. And when you do find one, it is not that easy to tell if there is a human behind it. The new user gets no answer and the OG user finds nobody worth answering. Nobody's fault. It is just how the incentives sit.

That is the problem Basecamp is aimed at. Both halves at once, because fixing one without the other does nothing.

## The idea

I am not a developer. I could see this problem clearly for years and I could explain it to any dev who would listen, but I couldn't build it. Then this year the AI tools got good enough that a stubborn non dev could actually get something running against the chain. So I thought fuck it, let me take a stab at our front door myself.

First ask: a plankton pond. One feed, every post from an account under a year old. No more trawling.

On every post, a card. Not a verdict, facts the chain already knows: age, activity, who made the account, how much of its writing is copy paste, whether it only talks to bots or votes for itself, what hours it writes, how much it earned and cashed out. Curators decide. The tool doesn't.

Here is the gamify part. I want to gamify the whole first year, both sides of it. The card is a mirror. An OG user reads it to decide whether to support you. You see the same card, next to ones that look better, so you go do real things: intro post, follow, vote, reply, a real back and forth, a community post, a power up. Each fills a ring from your actual chain history. Can't be faked. Making your card look better is learning the place and proving you're human. One act, both halves.

Then interests, up to five on public record, matched to an OG user who offered to guide. Guide, not mentor. Lighter word, more people will offer.

Then games, because useful isn't fun. Spotting bots is a skill, and skills make good games. Puppet Patrol, and the first one that plays, [Bugger](https://hivebugger.netlify.app/). Then the big one that ate my month.

## What Acidyo's proposal changed

The first few weeks I did all this on my own Claude Pro account and hit the limits constantly. Work on Hive for a couple of days, get cut off, go do the real life stuff I also needed Claude for, come back. Learning by braille. Then @acidyo put up [a DHF proposal for AI coding subscriptions](https://peakd.com/@acidyo/ai-coding-proposal) for people building on Hive, with the condition that you show him the repo. I sent him mine, some videos of me moving around the thing, and a promise that all of it stays open. He said yes.

One month of Claude Max. That is the whole budget for everything below. Small money, and it changed the job anyway. Before, I was building something because I wanted it to exist. After, somebody had backed it, and now I owed the people who would use it something genuinely useful and genuinely fun, not just finished. The bit I didn't expect is that it made me more committed to Hive, not less. On a chain that argues a lot about whether funding does anything, that felt worth writing down.

The hours are still hours. Two to three a day most days, call it somewhere near a hundred for the month. An estimate, I didn't run a timer.

Before the list: none of this is deployed. It runs on my machine. What follows is a month of work, not a launch.

## What got built

**3 to 12 Aug, Basecamp.** Plankton pond, interests, guide offers, the card and its rings. Bugger playable, Percy the guinea pig.

[SCREENSHOT: feed, one postcard]

**14 to 24 Aug, H.I.V.E.R.** Thirty-five passes in ten days. Zelda, but the world is Hive and the game is also a front end. A red bug on a surfboard riding the Hive logo, every house and citadel real and clickable. Emperor J SON, the critters, the Steem Ruins, your face riding the bug. Every commit ends with KNOWN ISSUES.

**30 Aug to 6 Sep, thinking.** Ethos and glossary written. Joining and the age gate removed. Four modes, the DHF race, the flipping ruins, the planet pass.

[SCREENSHOT: mode picker or planet]

**7 to 8 Sep, hardening.** Blocks, footprints, the ending at the keep, a tidy up, the first automatic checks.

## What is real

Houses are real posts from the current 30 minute round. Citadels are the actual top 21 witnesses. Tokens and traffic scale with the round's real ops. Footprints are who really voted or replied. The keep shows the real DHF vault, live, no keys. The game writes nothing to the chain.

[SCREENSHOT: house popover or DHF panel]

## The arguments

**Words.** New user and OG user mean account age only, same one year line. Guide, not mentor. Support covers a vote or a reply. Curator, new users too. Nothing carved in stone.

**Indicators, not conclusions.** Facts about a person. The reader decides.

**History as terrain.** The 2020 fork is the Steem Ruins, a rusted rail that stops. All 21 helmets at the keep and his hoard streams to the DHF Fun Park. His hoard became everyone's. Which is what happened.

## What went wrong

- **2.5D lean.** Built, looked, pulled out same day. Wanted a planet with sides, got it a week later.
- **Darker land.** Built, reverted. The red is the identity.
- **Payouts on houses.** A house lives 30 minutes, a payout takes seven days. Dead on arrival.
- **Power Up Day festival.** Parked, a distraction.
- **Two closure bugs.** Same trap twice.
- **No automatic checks** until the last day.

## For the developers

37 days, 21 with commits, 101 commits, 250 files, +32,768 / −809 lines, 39 tickets, 26 resolved. H.I.V.E.R. 18,003 lines in 110 files, Basecamp 5,520 in 56. About 100 hours, estimated. One month of Claude Max, Acidyo's proposal #386.

Last day: three files of 3,441, 2,515 and 1,894 lines became folders, biggest now 424, code moved verbatim. Caught one real bug, a doubled `ctx.restore()`. Then 30 headless checks, one command, no browser.

Code: [github.com/HIVE-Basecamp/denser](https://github.com/HIVE-Basecamp/denser), branch `feat/basecamp-activity-rings-and-games`. Start with `ETHOS.md`. Anyone is welcome to fork it.

## Next, and the ask

Not deployed, not dev reviewed, not proven fun, no live players yet. The drawing code has no checks beyond my eyes. The code still says newcomer.

Make it fun, then an SDK a friend's front end can try, then a dev review. A real measure of success: Percy playing because he wants to. Not yet.

I want people to argue with. Onboarding people, let's voltron. Wrong glossary word, say so. Like one piece, take it.

Yes, and. Get some Hive.

This post is rewarded by @commentrewarder, so let me know what you think.
