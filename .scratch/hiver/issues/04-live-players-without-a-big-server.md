# Live players without a big server

Type: research
Status: resolved
Blocked by: none

## Question

Bryan wants several real players in the world at once, able to run into each other. Does that need a server? Can hive.blog's server or anything Hive already runs do it? What is the cheapest honest path? Meno may offer 3speak server space.

## Answer

See `research/04-live-players-without-a-big-server.md`, plain-English summary at the top. Something in the middle is unavoidable, and it is tiny. The Hive chain is the wrong pipe (3-second blocks, 5 messages per account per block, Resource Credit cost, 64 KB blocks, permanent history). Nothing Hive runs is a live pipe for browsers. hive.blog's server is one plain Next.js container; do not count on it. 3speak space fits exactly: a Linux box with Docker and a hostname. Paid fallback: Cloudflare Durable Objects or a small Fly.io machine. Identity: sign once at connect with the Hive posting key, as Denser's login already does.
