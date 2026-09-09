# Build the payout change on houses

Type: task
Status: resolved
Blocked by: none

## Question

A post's house changes its look when its 7 days end and it pays out (ticket 12). The API gives each post's cashout time; use it.

## Answer

Closed 2026-09-08 without building it. Bryan spotted that it cannot happen.

A house is one post from the current round. `data/fetch-board.ts` asks the chain for the newest root posts, sorted by when they were written, and stops at the round's start. So every house on the board is a post from the last 30 minutes, and the world is thrown away and rebuilt when the next round starts. A house is never more than 30 minutes old. It can never reach its 7th day, so the payout moment can never be on screen.

Where the ticket came from: ticket 12 asked whether the game should follow Hive's real clocks. Bryan said "Yes. You can try it." A session turned that into two build tickets, the festival (18) and this one, and never held this one against the 30-minute round. His yes was to the calendar question. Nobody agreed to this.

Ticket 18 is not affected. The 1st of the month is a fact about the day, not about a post's age.

### The live-earning idea, underneath

Not agreed, not a ticket. Raised here so it is not lost.

The thing that IS real inside 30 minutes is money arriving. Votes land while the round runs, and the board already carries each post's payout so far (`post.payout`, `lib/board.ts`). A house could brighten as it earns, live, in front of the player. Same Hive truth as the original idea — an upvote is money — without needing seven days.

Open if it is ever taken up: whether it needs the board re-read mid-round or whether the footprints' vote tracks already say it; whether brightness is the right lever, given the land's brightness already carries the map's identity; and whether showing money on a new user's house edges toward a verdict about them, which the ethos does not allow.
