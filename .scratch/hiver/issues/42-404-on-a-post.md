# 404 on a post

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-12: "404 ON A POST. I went to a post house, opened it, got a 404. Reproduce: park at a house, Open."

## Answer

Found it in `lib/board.ts` and `lib/targets.ts`, the two places that turn a house's post into a link.

A post's real page on this site is three parts: `/{category}/@{author}/{permlink}` — for example `/hive-105017/@oflyhigh/p5ggz-and`. Checked this against the actual page folder (`apps/blog/app/[param]/[p2]/[permlink]/page.tsx`) rather than guessing.

Hive normally hands the game a ready-made link in that exact shape, and the game uses it as-is — that part was fine. But both files also had a fallback for when that link is missing, and the fallback only built `/@{author}/{permlink}` — two parts, no category. That shape has no matching page, so opening it lands on a 404.

What changed:
- `lib/board.ts`: the fallback link now includes the category (`post.category`, falling back to `blog` — the same default the site already uses elsewhere when a post has none), so it always builds the real three-part shape.
- `lib/targets.ts`: `postHref` no longer guesses a category-less link at all (it never had one to guess with). If it doesn't get a real link, it now says "no link" instead of handing back one that's guaranteed to 404.

Proof: took three real, live posts from the Hive network, stripped their links the way a missing link would look, and ran them through the actual (fixed) code that builds a house's post:

- `/risingstar/@omztech/brads-story-musical-creation` — 200
- `/hive-167922/@cryptohead69/why-your-market-orders-are-killing-your-account-ba-1789261239` — 200
- `/hive-174301/@bijutsu/a-moment-of-bliss` — 200

All three open cleanly now. The existing 33 headless checks still pass, unchanged.
