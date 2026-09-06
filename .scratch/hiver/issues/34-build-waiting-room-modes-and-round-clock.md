# Build the waiting room, mode picker and round clock

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-06: build the modes before every mode is fully defined. When you land at Basecamp: a welcome, a clock counting down to the next round, and a choice of the four modes (open explore, curation, adventure, front end). Use what is already agreed: explore is everything as now with no consequences; curation lights up new users' posts; adventure holds the game pieces (first: the DHF race, ticket 35); front end makes the hive.blog tools stand out. Register-in-the-first-five-minutes and the waiting-room feel are in `ideas.md`; try the clock first, add the join cutoff only if it feels right.

Constraints: `movement.ts` frozen (harder travel in game mode is ticket 17's job, not this one); new modules, not more lines in `canvas-map.tsx`; every string via t() in all locale files; nothing written to the chain; no image assets. Try it, look at it, pull back what does not work.

## Answer

Built 2026-09-06, tried in the browser, committed.

What is there now:
- Land at Basecamp: a welcome, "Next round in mm:ss", four mode buttons (open explore, curation, adventure, front end) with one line each. Every round starts here.
- Mode chip, top right: mode name and the round clock. Tap it to change mode.
- HUD line: ROUND mm:ss plus the mode name, so the clock reads even with the chip covered.
- Explore: the third hit no longer sends the bug home or drops tokens (Bryan: "no consequences"). Curation: every post breathes a faint cyan ring; new users keep their louder trail glow. Front end: a cyan beacon rings every landmark that is a hive.blog page. Adventure: consequences on, nothing else yet; the DHF race is ticket 35.
- The round now rolls over live: when the clock hits zero the world is built again and the welcome comes back. Before this, the old world stayed until the page was reloaded.
- The standalone route (/hive-frontend-universe) now sits below the site header. Its top HUD lines and the chip were hidden under the header before.

Not built, on purpose: the register-in-the-first-five-minutes cutoff (try the clock first); remembering the last mode; harder travel in game mode (that is ticket 17, movement.ts stays frozen).

Judgement calls for Bryan: the curation ring is subtle at map zoom; the front-end beacon colour is the map's cyan. Pull back or turn up.

How it was tried: dev server, in-app browser, sign-in state mocked in the browser's local storage with a real account name for the avatar. Screens checked: welcome with live clock; each mode picked; chip reopens the welcome; beacon around the tent in front end mode; no console errors from the module. Not tried: taking three hits in explore mode (needs an enemy encounter); the live rollover at the 30-minute mark (waited on the clock, not the boundary).

Files: `lib/modes.ts` (new), `hooks/use-round-countdown.ts` (new), `card/welcome-room.tsx` (new), `card/mode-chip.tsx` (new), `engine/canvas-map.tsx`, `engine/render.ts`, `hooks/use-board.ts`, `app/hive-frontend-universe/page.tsx`, nine locale files (`hive_frontend_universe.modes.*`, `hud.mode`, `hud.round`).
