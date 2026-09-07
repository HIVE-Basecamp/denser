# Build footprints

Type: task
Status: resolved
Blocked by: none

## Question

Fresh tracks in the world from who voted and who replied in the last 30 minutes; follow a track to the account that made it (ticket 09, liked). Facts only, no verdicts. Design first, then build.

## Answer

Designed and built 2026-09-07. Not committed.

The design, decided here for Bryan to pull back:
- A footprint is a track left by a real account that voted on or replied to a post this round. Facts only: who, and which of the two. Nothing weighs the account, nothing colours it good or bad.
- A track runs along one of the post's streets, from the house outward: five prints brightening toward a marker that wears the account's face (the app's own avatar pipeline, lazily, a letter until it loads). Follow the prints away from the post and you reach who was there.
- Votes are pale blue, replies green: the same two colours the ambient flows already use for votes and comments, so the world's grammar holds.
- A house carries at most six tracks, laid on its streets in turn and further out each lap: the four newest voters first (the board lists votes in the order they were cast), then repliers as they arrive. The post's own author never gets a reply track.
- Votes come free with the board. Replies are asked for lazily: a house within reach of the bug is asked once, only if its post has replies, one read-only call, cached an hour. Nothing is fetched for houses the bug never nears.
- Hover the marker: "@name voted" or "@name replied" (`hive_frontend_universe.footprints.*`, in all nine locales). Click it: the small panel with the account's page to open, the same panel the citadels use.
- Play zoom only. On the pulled-out map the tracks would be dust. On the back of the board (Steem) there are none: the tracks are facts about the living chain.

Code: `engine/footprints.ts` (placement, drawing), `data/fetch-replies.ts` (one fetch, cached), hover and click in `engine/canvas-map.tsx`, the draw call in `engine/render.ts`, `lib/targets.ts` (the new target kind), nine locale files, `README.md`. `movement.ts` untouched; nothing written to the chain; no image assets beyond real avatars.

Left for later, on purpose: a freshness fade by minutes (the board carries no per-vote time; a per-post votes call would give it); the vote's weight (a fact too, but it edges toward a verdict); showing tracks from the live players themselves once they exist (ticket 22).

Judgement calls for Bryan: six per house and four voters of them; the reach out from the house; whether the marker should show the face or only the prints; whether tracks belong on the far map after all.

How it was tried: a headless run with the real world builder and a fake board (86 tracks over 26 houses, newest voters first, six at most per house, repliers added with no duplicates, every track on a street of its own house and short of mid-street); types and lint clean; all nine locale files valid JSON with the two keys (the repo's translation check fails on 725 keys that predate this ticket, none of them these). In the in-app browser: the game runs with the module and no console errors. A look at the live chain while writing this: 13 of the 19 posts in the round carried votes (up to 211) and 3 had replies, so a round has tracks to show. Not seen by eye yet: a track beside a live house, the hover chip, the panel. The browser pane ran the game at a crawl this session and no house stood near Basecamp. To see them: ride to any post with votes; the prints lead out from it.
