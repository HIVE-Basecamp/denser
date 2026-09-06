# Live players without a big server

Research note for H.I.V.E.R. (Hive Frontend Universe). Written 2026-09-06.
Question: Bryan wants several real players in the world at once, each at their
own spot, able to bump bugs. He asked whether that needs a server, whether the
hive.blog server or something Hive already runs can do it, and what the
cheapest honest path is. Meno may offer space on the 3speak server.

Everything marked PROPOSAL is a proposal. Nothing here is decided.

Source discipline: Hive facts come from the hive source code, the developer
portal repository and live calls to api.hive.blog made while writing (numbers
are stamped). Prices come from each vendor's own pricing page on the day.
Where a page could not be opened (developers.hive.io returned 403 to the
fetcher, Ecency docs 403, a few vendor pages 404), that is said. Code facts
come from this repo at the paths given. Every claim has a URL in section 9.

---

## Plain English summary for Bryan

1. Yes, something must sit in the middle. A browser only dials out and cannot
   find another browser by itself; even browser-to-browser tech (WebRTC) needs
   an "introducer" server. The real question is "how small, and who runs it".
2. It is tiny: a position is two small numbers plus a name. A few hundred
   lines of code on a Raspberry-Pi-sized machine handles hundreds of players.
3. The Hive chain is the wrong pipe: a block every 3 seconds, at most 5
   messages per account per block, about 174 million RC each, 64 KB blocks.
   One live bug at one message a second needs roughly 47,000 HP, 200 players
   would not fit, and every footstep would become permanent history.
4. Nothing Hive runs today is a live pipe for browsers: hived's WebSocket
   only answers questions, HAF is a database, Hivesigner is login, HiveAuth
   relays only between a site and your wallet, openhive.chat is a chat room.
5. hive.blog's server is one Docker container running plain Next.js. Live
   connections would mean rebuilding how the site is built and deployed;
   bolting on polling puts game load on the main site. Do not count on it.
6. 3speak space is exactly right: a Linux box with Docker and a hostname.
   Cost to Bryan nothing; cost to Meno one container and a wss:// address.
7. Paid fallback: Cloudflare Durable Objects (free for a handful of players
   at a gentle rate, $5 to $25 a month at 200) or a $2 Fly.io machine.
   Per-message services (Supabase, Ably) are out.
8. Identity is solved: one posting-key signature per session, same as the
   blog's login. No new accounts.
9. Yours to choose: real names or nameless bugs like Journey, and visible by
   default or opt-in. Section 8 lays both out, decides nothing.

---

## The options, side by side

Costs assume 5 position messages a second per player unless noted. "Reviewer"
is what a Hive core dev has to accept to merge the Denser side.

| Option | Who runs it | 10 players / month | 200 players / month | Build effort | Reviewer burden | Main risk |
|---|---|---|---|---|---|---|
| (a) tiny `ws` relay on a donated box (3speak) | Meno / a friend | $0 | $0 plus bandwidth the box already has | 1 to 2 weeks (relay ~300 lines, client ~400) | Low on Denser: one env var URL, one client module, solo play if unreachable | One box, one person; who patches it |
| (b) Cloudflare Workers + Durable Objects | Whoever owns the CF account | $0 at ~1 msg/s, ~$6 at 5 msg/s | ~$24 (24/7), ~$5 at real peaks | Same as (a) plus CF-specific runtime | Low on Denser; medium overall: vendor runtime, someone's card | Vendor lock-in, account ownership |
| (b') Fly.io / Railway small VM | Whoever pays | $2 to $8 | $2 to $8 plus egress ($0.02 to $0.05 per GB) | Same as (a) | Same as (a) | Egress bill if fan-out is naive |
| (c) WebRTC peer-to-peer + small signaling server | Still needs a server (signaling, STUN, maybe TURN) | $0 with PeerJS's free cloud | Does not scale: 199 connections per browser | 2 to 3 weeks; ICE/TURN debugging | Medium-high: NAT edge cases, TURN provisioning | Peers see each other's IP; symmetric NAT fails without paid TURN |
| (d) Nostr public relays, ephemeral kinds | Strangers | $0 | $0 until a relay throttles | 1 to 2 weeks | High: hive.blog talking to random third-party relays; positions publicly readable | Rate limits, relays vanish, no Hive identity built in |
| (e) Supabase Realtime / Ably / PartyKit | Vendor | Free tiers die in under an hour at 5 msg/s; ~$1,000+ at $2.50 per million messages | Thousands per month | 1 week | Medium: vendor SDK in the blog | Per-message pricing is the wrong model for movement |
| (f) inside the hive.blog Denser deployment | Hive core devs' ops | $0 | $0 | 1 week for polling; WebSocket needs a deploy redesign | High: touches the image and process every Hive user hits; replicas break in-memory state | Game load on the main site; OOM history (denser#886) |

Reading: (a) is cheapest and cleanest if the box is real. (b) is the safest
fallback with no friend involved. (c), (d), (e) each fail one hard test.
(f) is the answer to "can I just use hive.blog's server", and the answer is
"not for live connections, not without changing the deployment".

---

## 1. Why something in the middle is unavoidable

- A web page can only open connections outward. Nothing in a browser
  accepts an incoming connection from a stranger, and a page has no way to
  learn another visitor's network address. MDN's own definition of the
  WebSocket API is "a two-way interactive communication session between the
  user's browser and a server" [S1]. Browser to browser is not in the model.
- WebRTC, the browser-to-browser technology, still needs an introducer. MDN:
  "A form of discovery and media format negotiation must take place ... in
  order for two devices on different networks to locate one another. This
  process is called signaling and involves both devices connecting to a
  third, mutually agreed-upon server" [S2]. Behind home routers it also needs
  STUN, and often TURN, servers; MDN adds you "should always use STUN/TURN
  servers which you own, or which you have specific authorization to use"
  [S2].
- So every path has a machine in the middle. The variable is how much that
  machine does: an introducer only (c), a relay that forwards small packets
  (a, b, d, e), or a full game server (nobody is proposing that).

---

## 2. Why the Hive chain itself is the wrong pipe

The idea "each player broadcasts a custom_json every second, everyone reads
the chain" fails five separate ways. Constants are from the hive source [S3],
live numbers were read from api.hive.blog on 2026-09-06 [S4, S5].

1. Latency. `HIVE_BLOCK_INTERVAL 3` [S3]: a position enters a block up to 3
   seconds after sending, then every other player must poll an API node to
   see it. Best case 3 to 6 seconds behind; the game renders 60 times a
   second.
2. Hard cap on rate. `HIVE_CUSTOM_OP_BLOCK_LIMIT 5` and the check in
   database.cpp: "Account ${a} already submitted ${n} custom json
   operation(s) this block." [S3, S6]. That is at most 1.67 messages a second
   per account, no matter how much HP you have.
3. Resource Credits. Live `rc_api.get_rc_stats` (block 109,612,800) shows
   `custom_json_operation` average cost 174,183,392 RC [S4]. An account's
   maximum RC equals its vesting shares in millionths (devportal recipe:
   `maxMana = totalShares * 1000000` [S7]; confirmed live: buttcoins
   `max_rc` + `delegated_rc` matches `vesting_shares` x 1e6 [S5]) and it
   refills over 5 days (`HIVE_VOTING_MANA_REGENERATION_SECONDS (5*60*60*24)`
   [S3]). With 1,611.6 VESTS per HIVE from live global properties [S5], one
   HP sustains about 3,730 RC per second. Therefore:
   - 1 message every 3 seconds, forever: about 15,500 HP per player.
   - 1 message a second: about 47,000 HP per player.
   - A brand-new account with no HP gets only the creation adjustment
     (2.02 billion RC in the record inspected [S5]): about 11 custom_json
     per 5 days, then nothing. Inference from one record; the exact figure
     depends on the creation fee at the time.
4. Block space. Live `maximum_block_size` is 65,536 bytes [S5]. 200 players
   at the 5-per-block cap is 1,000 operations a block; at ~100 bytes each
   that is 100 KB, more than the whole block. The game would be competing
   with every vote and transfer on Hive.
5. Norms and promises. Every message becomes permanent chain history
   (`resource_history_bytes` is one of the five billed resources [S8]).
   README.md for this module says "this module never signs or broadcasts
   anything" and HANDOFF.md carries "The game broadcasts nothing" as human
   intent. RC exists to block exactly this pattern: "Transactions which would
   cause a negative RC balance are blocked" [S9].

Verdict: the chain is for things that should last. Footsteps should not.

---

## 3. What Hive already runs, and whether any of it helps

Checked against each project's own source or docs.

- hived WebSocket endpoint. Exists ("Local websocket endpoint for webserver
  requests") but `handle_ws_message` just calls `api->call(body)`: request
  and response, no subscriptions [S10].
- HAF. "developed to simplify the creation of highly scalable,
  blockchain-based applications": Postgres filled from hived, apps as SQL
  schemas, no browser push [S11]. It only sees what is on chain, so section
  2 applies.
- Hivemind / bridge API. What the game already calls (`data/`). Request and
  response.
- Hivesigner. OAuth2 login and signing over "simple standard REST APIs"
  [S12]. Nothing live.
- HiveAuth (HAS). A WebSocket relay, purpose-built: "The HAS will queue
  requests from the APP and forward them to any newly or already connected
  PKSA" (the wallet app) [S13]. Using it as a game bus would abuse someone
  else's service; its challenge flow helps section 5 instead [S14].
- Hive Engine. "a sidechain powered by Hive ... post a message on the Hive
  blockchain ... the message will then be catched by the sidechain" [S15].
  Reads custom_json, so inherits every limit in section 2.
- openhive.chat (Rocket.Chat). The one live server this repo already talks
  to: `.env.blog.example` lines 61 to 98, `packages/smart-signer/lib/rocket-chat.ts`,
  `apps/blog/pages/api/auth/chat-token.ts`. Its Realtime API "utilizes
  WebSockets" with "Method Calls and Subscriptions" [S16]. A hidden room
  could in theory carry a slow heartbeat. Against it: it stores every
  message, it is someone else's chat server, the integration is off by
  default (`REACT_APP_OPENHIVE_CHAT_IFRAME_INTEGRATION_ENABLE="no"`) and
  gated on OAuth consent, and 5 messages a second per player is spam by any
  chat server's standards. One question to its operator (open question 4),
  not a design.
- 3speak / SPK Network. Public repos are Node and TypeScript infrastructure
  (Trole, indexer nodes, desktop apps) [S17]. Nothing presence-shaped. A
  donated box is a box: option (a).
- PeakD, Ecency. No public real-time presence API found; not searched
  exhaustively.

Honest answer to "does Hive provide it": no. Hive provides identity (section
5) and the world's contents (already used). The live pipe has to be added.

---

## 4. The options in detail

### (a) Tiny WebSocket relay on a donated box

- What: one Node process using `ws` ("a simple to use, blazing fast, and
  thoroughly tested WebSocket client and server implementation" [S18]). It
  verifies one signature per connection (section 5), keeps account to last
  position in memory, forwards small packets, stores nothing on disk.
- Who runs it: Meno's box or any friend's VPS. Needs Docker (or Node 20+),
  a hostname and TLS, since an https page may only open `wss://`; Caddy or
  the box's existing proxy handles the certificate.
- Cost: $0 if donated. On Fly.io's smallest machine "$0.0028" an hour,
  "$2.02" a month, egress "North America and Europe at $0.02 per GB" [S19].
  Railway: "$5/month, including $5 of monthly usage credits", egress "$0.05
  per GB" [S20]. Bandwidth in section 6.
- Effort: relay ~300 lines; Denser side ~400 (connect, send, draw others,
  degrade to solo). The world is deterministic per window and positions are
  `edge + t` (movement.ts: "Do not add position state outside `edge` +
  `t`"), so the relay never needs to know the world.
- Reviewer sees: a client module behind one env var, the URL added to the
  CSP (`packages/middleware/lib/csp.ts` builds `connect-src` from env), a
  clear fallback when unset. The relay can live in this monorepo so it is
  reviewed in the same MR (PROPOSAL 2).
- Risk: one machine, one person. If it dies the game is single-player,
  which is today.

### (b) Cloudflare Workers + Durable Objects

- What: a Durable Object is a small stateful server. PartyKit popularised
  the pattern ("Each PartyKit server (also known as a Party), is backed by a
  Cloudflare Durable Object" [S21]), then joined Cloudflare on 2024-04-05;
  users now "pay for the resources you use, with no extra charge" on their
  own account [S22]. Its own pricing page 404s.
- Free plan: "100,000 / day" requests, "13,000 GB-s / day" duration [S23];
  Workers Free "10 milliseconds of CPU time per invocation" [S24].
- Paid: "$5 USD per month for an account", including "1 million / month"
  Durable Object requests and "400,000 GB-s / month", then "+ $0.15/million"
  and "+ $12.50/million GB-s" [S23, S24].
- WebSocket billing: "a 20:1 ratio is applied to incoming WebSocket
  messages" [S23]; with hibernation "Billable Duration (GB-s) charges do not
  accrue" while "Clients remain connected" [S25]. Objects "can act as
  WebSocket servers that connect thousands of clients per instance" [S25],
  each "inherently single-threaded" with "a soft limit of 1,000 requests per
  second" [S26].
- Estimate, 200 players at 5 msg/s, 24/7: 1,000 msg/s = 50 billable req/s =
  130 M a month, about $19 over the included million, plus $5. Duration if
  never asleep, billed at 128 MB (my assumption): 324,000 GB-s, inside the
  included 400,000. About $24. At real peaks the $5 plan covers it.
- Estimate, 10 players: 5 msg/s = 216 k req/day, over the free 100 k, so $5
  to $6. At the event-driven rate (section 6, ~1.5 msg/s) it is 65 k/day and
  fits the free plan; 24/7 duration (10,800 GB-s/day) sits just under the
  free 13,000.
- Effort: same logic in Workers' runtime, not plain Node. Reviewer sees a
  second runtime and a Cloudflare account someone owns. Risk: whose card,
  and lock-in.

### (c) WebRTC peer-to-peer with a small signaling server

- What: browsers talk directly over DataChannels after a signaling server
  introduces them (section 1). PeerJS wraps it: "PeerJS uses PeerServer for
  session metadata and candidate signaling"; "By default, it connects to the
  free PeerJS Cloud server"; "You can also run your own PeerServer" [S27].
  No limits documented on the pages fetched.
- Why it does not fit: full mesh means each browser holds N-1 connections
  and uploads N-1 copies of every update. At 200 players that is 199
  connections and 995 packets a second out of every home line. Past a few
  dozen players you need a central forwarder anyway: option (a) with extra
  steps.
- Hidden costs: peers behind symmetric NAT need TURN, a paid relay
  (Cloudflare: "$0.05/real-time GB outbound" standalone [S28]). ICE
  candidates expose every peer's IP address to the others; a relay never
  does.
- Cost $0 on the public PeerServer for a handful of players; effort 2 to 3
  weeks with ICE debugging; the most moving parts of any option.

### (d) Nostr public relays as a free ephemeral bus

- What: public WebSocket relays. NIP-01 defines kinds 20000 to 29999 as
  "ephemeral, which means they are not expected to be stored by relays"
  [S29]; NIP-16 now just says "Moved to NIP-01" [S30]. Cost $0.
- Why fragile: relays may refuse anything; NIP-01's own example is
  `["OK", ..., false, "rate-limited: slow down there chief"]` [S29]. NIP-11
  lets them advertise `max_subscriptions`, `restricted_writes`,
  `payment_required`, `auth_required` [S31]. Live NIP-11 read 2026-09-06:
  relay.damus.io `max_subscriptions 200`; nos.lol `max_subscriptions 20`,
  "Generally accepts notes, except spammy ones."; relay.primal.net
  `max_subscriptions 20` [S32]. 200 players at 5 events a second is spam to
  an operator who owes you nothing.
- Identity: Nostr uses its own Schnorr keys. Keychain and hb-auth never
  expose raw Hive keys, so each event would need a Hive signature inside it
  (per-message verification returns, section 5), and every position would
  be publicly readable worldwide.
- Reviewer sees hive.blog opening sockets to third-party relays picked by
  the game, each added to the CSP. Expect a hard no.

### (e) Hosted realtime channels

- Supabase Realtime Free: "Concurrent Peak Connections: 200 included",
  "Messages Per Month: 2 Million included"; Pro $25 with "5 Million
  included, then $2.50 per Million" [S33]. Ably Free: "6M messages / month",
  "200 concurrent connections"; Standard "$29 / month", "$2.50 / million"
  [S34].
- Arithmetic kills it: fan-out counts. 10 players at 5 msg/s is 50 in plus
  450 out a second, 1.3 billion a month, about $3,200. The gentle
  event-driven rate for 10 players is still about $970. Free tiers last
  minutes. Fit only for a slow "who is online" heartbeat, not movement.

### (f) Inside the hive.blog Denser deployment

Checked against the repo:

- The blog image runs one process, `node .${TURBO_APP_PATH}/server.js`
  under tini (`Dockerfile`), from Next.js standalone output
  (`apps/blog/next.config.js` line 16). Deploys are one `docker run` per app
  (`scripts/run_instance.sh`); CI deploys blog.openhive.network and pushes
  protected tags to `registry-upload.hive.blog` (`.gitlab-ci.yml`). How
  hive.blog itself runs the image is not in the repo (open question 3).
- WebSockets need a custom server, and Next.js says of standalone mode: "it
  does not trace custom server files ... These cannot be used together"
  [S35]. Live sockets in the blog process mean changing the whole site's
  build and deploy, or a second process in the container. A reviewer will
  push back on either.
- Polling instead: a Next API route (the blog has `pages/api/auth`, `chat`,
  `users`, `health`) could hold positions in memory. But
  `docker/docker-compose.yml` runs `${BLOG_REPLICAS:-1}` replicas, each with
  its own memory, so players split across replicas unless Redis is added;
  the heap is capped (`--max-old-space-size=1536`, citing denser#886), so
  game state shares memory with every page render on Hive's main site; and
  200 players polling 5 times a second is 1,000 requests a second on the SSR
  process.
- Verdict: demo-able, wrong for production, and the heaviest reviewer
  burden because it touches what every Hive user hits.

---

## 5. Identity without a new account system

- Signing already exists in Denser. `packages/smart-signer/lib/signer/signer.ts`
  declares `abstract signChallenge(arg: SignChallenge): Promise<string>`, and
  every signer implements it: Keychain ends in
  `window.hive_keychain.requestSignBuffer(this.accountName, msg, this.role, ...)`
  (`@hiveio/wax-signers-keychain` dist/index.js line 76); hb-auth hashes the
  message with SHA-256 and signs the digest inside its worker
  (`signer-hbauth.ts` lines 82 to 95; hb-auth: "user's keys are never exposed
  to the main thread" [S36]); HiveAuth sends a `challenge_req`, "the PKSA
  signs the challenge and sends a `challenge_ack`" [S14]. Keychain's
  `requestSignBuffer` takes `account`, `message`, `key` ("'Posting','Active'
  or 'Memo'") [S37]. HANDOFF.md's constraint "Do not call a signer directly"
  means the game goes through this abstraction, never `window.hive_keychain`.
- Verification already exists too. `verifySignature` recovers the public key
  with wax `getPublicKeyFromSignature(message, signature)` and compares it
  (`packages/smart-signer/lib/verify-signature.ts`); `verifyLoginChallenge`
  takes the key from the account's `posting.key_auths[0]` and logs an error
  for multi-key or weighted authorities (`verify-login-challenge.ts`). The
  relay would do the same: fetch the account once
  (`database_api.find_accounts` / `condenser_api.get_accounts`), take the
  posting key, recover, compare.
- Cost of verifying every message, measured not guessed: `@noble/curves`
  1.4.2 (pure JavaScript, already in this repo's node_modules), Node 24,
  Apple M-series: verify 0.81 ms, recover-public-key 0.88 ms per signature
  (2,000 each). 200 players at 5 msg/s is 1,000 verifications a second,
  about 0.9 CPU-seconds per second: a whole core of a tiny box. wax's WASM
  would be faster, but the real blocker is the other end: Keychain opens a
  "Sign message" dialog per `requestSignBuffer` (its `title` parameter
  renames that dialog [S37]) and HiveAuth asks the phone to approve each
  challenge [S14]. Signing every packet is unusable, not just expensive.
- Shape that works: verify once at connect, then trust the socket.
  1. Relay sends a random nonce on connect.
  2. Client signs `hiver|<nonce>|<account>|<timestamp>` through Denser's
     `signChallenge` with the posting key (one prompt, same as login).
  3. Relay fetches the posting key, recovers, compares, checks freshness,
     marks the socket as that account. Later packets need zero crypto.
  4. Optional: a 32-byte random token, 30-minute life, in memory only, so a
     page reload rejoins silently within the window.
- Cheaper if the relay is trusted by Denser: a Next API route mints an HMAC
  token for the already-logged-in user (cookie session in
  `packages/smart-signer/lib/session.ts`); the relay checks it with a shared
  secret. No chain call, no prompt. Cost: a secret shared with whoever runs
  the relay, which a reviewer may not want on a friend's box. PROPOSAL 4.

---

## 6. What actually needs sending, in bytes

Fields per update and their smallest honest encoding:

| Field | Range | Bytes |
|---|---|---|
| account name | 3 to 16 chars (`HIVE_MIN/MAX_ACCOUNT_NAME_LENGTH` [S3]) | 16 on connect only; a 2-byte slot id afterwards |
| edge id | index into the window's edge array (`mesh.ts` line 419, `finalEdges.map((e, id) => ...)`) | 2 (u16) |
| t | 0..1 | 2 (u16, 1/65535 of an edge) |
| facing | left/right | 1 |
| helmets | 0 to 21 (`HELMET_TOTAL = 21`) | 1 |
| timestamp | ms since window start (30 min fits) | 4 |

Binary payload: 12 bytes, 14 with the slot id on the way out. As JSON
(`{"a":"buttcoins","e":1234,"t":0.5123,"f":1,"h":7,"ts":...}`) about 75
bytes: fine for a first version, 5x the bytes.

Framing: RFC 6455 uses a 2-byte header up to 125 bytes of payload, 4 bytes
up to 65,535, and "All frames sent from the client to the server are masked
by a 32-bit value" (4 more) [S38]. TCP and IPv4 headers are 20 bytes each at
minimum [S39, S40]; with TLS call it 60 extra bytes per packet on the wire.

Per player at 5 updates a second: 5 x (12 + 6) = 90 bytes a second at the
WebSocket layer, about 400 on the wire, 3 kbit/s. Upload is never the
problem.

Server side, 200 players, four ways of doing fan-out:

| Strategy | Per client down | Server out, 200 clients | Per hour | Per month if 24/7 |
|---|---|---|---|---|
| naive: forward every update to everyone | 995 frames/s x 16 B = 16 KB/s | 3.2 MB/s (25 Mbit/s) | 11.5 GB | 8.3 TB |
| batched: one snapshot per tick, 5 Hz | 2,804 B x 5 = 14 KB/s | 2.8 MB/s | 10 GB | 7.3 TB |
| nearest 20 only, 5 Hz | 1.4 KB/s | 280 KB/s (2.2 Mbit/s) | 1 GB | 725 GB |
| nearest 20, event-driven (~1.5 msg/s) | ~0.4 KB/s | ~85 KB/s | ~0.3 GB | ~220 GB |

Batching saves packets, not bytes. Bytes are saved by sending only nearby
players and only on change. Rail movement is deterministic: given edge, t,
direction and `MOVE.SPEED` (440 px/s, `movement.ts`) every client predicts
where a bug is until it turns, jumps or stops, because everyone has the same
world. "Send on change plus a 1 Hz heartbeat" is enough.

10 players, naive, 5 Hz: 10 x 9 x 5 x 16 B = 7.2 KB/s total, 26 MB an hour.
Nothing.

Money: at Fly's $0.02/GB the naive 24/7 200-player case is about $166 a
month of egress, nearest-20 about $15, event-driven about $4; Railway 2.5x
those. Cloudflare's pricing pages list no per-GB egress line [S23, S24]. A
donated box pays nothing extra until its uplink saturates (25 Mbit/s naive
is real load on a home line, trivial in a datacenter).

---

## 7. Privacy and abuse, smallest sane protections

Presence reveals what the game does not today: that an account is online
now, where it is, how long it stays, and with names, who walks with whom.
Threats: tailing a chosen account; throwaway accounts as spam bugs; lying
about position (cosmetic, since presence changes no score).

Smallest set that covers them, each a line of code or config:

1. One socket per account; a second replaces the first. An attacker then
   needs many Hive accounts, and `claim_account_operation` averages 8.87
   trillion RC live [S4]. Hive identity is the anti-spam layer for free.
2. Per-socket rate limit (say 10 messages a second, excess dropped,
   persistent excess disconnected). Protects the box.
3. Bounds check only: `edge` inside the window's edge count, `t` in 0..1,
   helmets 0..21. No physics checks; nothing is gained by lying, and the
   round-2 "Korok discipline" says nothing earned changes what a bug can do
   to anyone.
4. Nearest-N fan-out (section 6) doubles as privacy: nobody gets the whole
   roster. Pair with "the relay stores nothing": no disk, no position logs.
   Also the easiest sentence for a reviewer to verify.
5. Reuse Hive mute: bugs of accounts the user mutes are not drawn. Client
   side only.
6. No free text in version one. Journey shipped with one chirp and no chat
   [S41]; nothing typed, nothing to moderate.
7. A visibility switch (section 8), remembered locally. Off means the client
   never connects.

Not needed yet: reports, bans, persistent tokens. All assume stored data the
relay does not have.

---

## 8. Anonymous like Journey, or real names

Both are one field. The relay either forwards the account name or replaces
it with a per-window pseudonym before fan-out. Doing it server-side matters:
if the client receives the real name and merely hides it, anyone with the
browser's dev tools sees it.

Journey's choice, in its designer's words (Jenova Chen, DICE 2013, as
reported by MCV/DEVELOP): "only display the name of your in-game partner as
part of the credits", accepting that "maybe we're giving up the chance to be
viral, but we had to focus on the emotion we wanted to present" [S41].

| | Anonymous (Journey) | Real Hive names |
|---|---|---|
| Fits | "Visual indicators, not conclusions" (ETHOS.md); nothing shown about another account, so nothing judged | The front-end layer: every landmark links to a real page, so a bug could too |
| Loses | The Basecamp point of meeting real new users and OG users; a bug you cannot follow up with | The calm: names invite judgement, tailing, and "who is that" |
| Abuse surface | Near zero: no target to pick | Tailing a chosen account; needs protections 4 to 7 above |
| Relay work | Substitute a pseudonym per window (one map) | None |
| Client work | A nameless bug design; a "wave" or chirp as the only signal | Name label, click to open profile via the existing avatar proxy |
| Middle paths | Reveal on mutual wave; reveal when both park at the same landmark; reveal at the 30-minute reweave, Journey's credits | Names for OG users, anonymity for new users (or the reverse); names only inside communities |

With Nostr (d) or WebRTC (c) anonymity is weaker regardless: relays publish
to the world, peers see IPs. Only (a), (b) and (f) can keep the choice
honest.

No recommendation here. Section 10 asks the question.

---

## 9. Sources

- [S1] MDN, The WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- [S2] MDN, Signaling and video calling (WebRTC): https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
- [S3] hive source, protocol/config.hpp (`HIVE_BLOCK_INTERVAL`, `HIVE_CUSTOM_OP_BLOCK_LIMIT`, `HIVE_CUSTOM_OP_DATA_MAX_LENGTH (8192)`, `HIVE_VOTING_MANA_REGENERATION_SECONDS`, account name lengths): https://raw.githubusercontent.com/openhive-network/hive/master/libraries/protocol/include/hive/protocol/config.hpp
- [S4] live `rc_api.get_rc_stats`, api.hive.blog, 2026-09-06 UTC, `block 109612800`: custom_json avg_cost 174,183,392; claim_account avg_cost 8,873,725,488,951
- [S5] live `database_api.get_dynamic_global_properties` (head 109,664,421; `total_vesting_shares` 346,922,618,088.533473; `total_vesting_fund_hive` 215,272,002.329; `maximum_block_size` 65536) and `rc_api.find_rc_accounts` / `condenser_api.get_accounts` for buttcoins (`max_rc` 209,617,470,501,208; `delegated_rc` 225,045,000,000,000; `vesting_shares` 434,708,365.222201; `max_rc_creation_adjustment` 2,020,748,973), api.hive.blog, 2026-09-06
- [S6] hive source, chain/database.cpp (custom_op_visitor assert): https://raw.githubusercontent.com/openhive-network/hive/master/libraries/chain/database.cpp
- [S7] Hive devportal, calculate RC recipe: https://raw.githubusercontent.com/openhive-network/devportal/master/_tutorials-recipes/calculate_rc_recipe.md
- [S8] Hive devportal, RC demo (resource types, `custom_json_operation_exec_time`): https://raw.githubusercontent.com/openhive-network/devportal/master/_tutorials-python/rcdemo.md
- [S9] Hive devportal, RC bandwidth system: https://raw.githubusercontent.com/openhive-network/devportal/master/_tutorials-recipes/rc-bandwidth-system.md (developers.hive.io itself returned 403 to the fetcher; the repo copy was used)
- [S10] hive source, webserver plugin: https://raw.githubusercontent.com/openhive-network/hive/master/libraries/plugins/webserver/webserver_plugin.cpp
- [S11] HAF README: https://gitlab.syncad.com/hive/haf/-/raw/develop/README.md
- [S12] Hivesigner docs: https://docs.hivesigner.com/h/faq/questions and https://docs.hivesigner.com/h/guides/get-started/hivesigner-oauth2
- [S13] HiveAuth protocol description: https://docs.hiveauth.com/developer-documentation/protocol-description.md
- [S14] HiveAuth challenge flow: https://docs.hiveauth.com/developer-documentation/protocol-description/challenge.md
- [S15] Hive Engine (hivesmartcontracts) README: https://raw.githubusercontent.com/hive-engine/hivesmartcontracts/master/README.md
- [S16] Rocket.Chat Realtime API: https://developer.rocket.chat/reference/api/realtime-api
- [S17] SPK Network GitHub organisation: https://github.com/spknetwork
- [S18] ws (Node WebSocket library): https://github.com/websockets/ws
- [S19] Fly.io pricing: https://fly.io/docs/about/pricing/
- [S20] Railway pricing: https://railway.com/pricing
- [S21] PartyKit, How PartyKit works: https://docs.partykit.io/how-partykit-works/
- [S22] PartyKit is joining Cloudflare (2024-04-05): https://blog.partykit.io/posts/partykit-is-joining-cloudflare
- [S23] Cloudflare Durable Objects pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/
- [S24] Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- [S25] Cloudflare, WebSockets and Hibernation in Durable Objects: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- [S26] Cloudflare Durable Objects limits: https://developers.cloudflare.com/durable-objects/platform/limits/
- [S27] PeerJS docs and PeerServer: https://peerjs.com/docs/ and https://peerjs.com/peerserver
- [S28] Cloudflare TURN service: https://developers.cloudflare.com/realtime/turn/
- [S29] NIP-01: https://github.com/nostr-protocol/nips/blob/master/01.md
- [S30] NIP-16 (moved): https://github.com/nostr-protocol/nips/blob/master/16.md
- [S31] NIP-11: https://github.com/nostr-protocol/nips/blob/master/11.md
- [S32] live NIP-11 documents fetched 2026-09-06 with `Accept: application/nostr+json` from https://relay.damus.io, https://nos.lol, https://relay.primal.net
- [S33] Supabase pricing: https://supabase.com/pricing
- [S34] Ably pricing: https://ably.com/pricing
- [S35] Next.js, custom server guide: https://nextjs.org/docs/pages/guides/custom-server
- [S36] hb-auth README (in node_modules, `@hiveio/hb-auth` 1.28.4): https://gitlab.syncad.com/hive/hb-auth
- [S37] Hive Keychain extension documentation, `requestSignBuffer`: https://github.com/hive-keychain/hive-keychain-extension/blob/master/documentation/README.md
- [S38] RFC 6455 section 5.2, Base Framing Protocol: https://www.rfc-editor.org/rfc/rfc6455#section-5.2
- [S39] RFC 791, Internet Protocol (20-byte minimum header): https://www.rfc-editor.org/rfc/rfc791
- [S40] RFC 9293, TCP (20-byte minimum header): https://www.rfc-editor.org/rfc/rfc9293
- [S41] MCV/DEVELOP report of Jenova Chen's DICE 2013 talk: https://mcvuk.com/development-news/jenova-chen-reveals-secrets-of-journey-design/
- Local benchmark: `@noble/curves` 1.4.2 and `@noble/hashes` 1.4.0 from this repo's node_modules, Node v24.19.0 arm64, 2,000 signatures each way; script kept in the session scratchpad, not in the repo.
- Repo files read: `apps/blog/features/hive-frontend-universe/{README.md,HANDOFF.md,engine/movement.ts,engine/helmets.ts,lib/mesh.ts}`, `packages/smart-signer/lib/{verify-signature.ts,verify-login-challenge.ts,session.ts,rocket-chat.ts,signer/signer.ts,signer/signer-keychain.ts,signer/signer-hbauth.ts}`, `packages/middleware/lib/csp.ts`, `Dockerfile`, `docker-bake.hcl`, `docker/docker-compose.yml`, `stack/compose.blog.yml`, `stack/Caddyfile`, `scripts/run_instance.sh`, `.gitlab-ci.yml`, `.env.blog.example`, `apps/blog/next.config.js`, `apps/blog/pages/api/`.

Not found or not opened: a per-player statement of PeerJS Cloud limits; a
PartyKit pricing page (404); Ecency's RC page (403); any PeakD or Ecency
public real-time API.

---

## 10. Open questions

Only Bryan or Meno can answer these.

1. Meno's box: what is on it (Docker? Node? a proxy with TLS?), can it have
   a hostname, who has root, what happens when Meno is on holiday.
2. Radius: is "only bugs near me" acceptable, or must the travel map (M)
   show every player? The second costs the naive numbers in section 6.
3. hive.blog itself: who runs the container and its proxy, and would they
   ever route a `wss://` path to a second container? Not in the repo.
4. openhive.chat: who operates it, and would a slow presence heartbeat in a
   hidden room be welcome? Only matters if (a) and (b) both fall through.
5. Names or no names (section 8), and visible by default or opt-in.
6. Should the relay code live in this monorepo (reviewed with the game) or
   next to Meno's things? The constraint against new folders binds me, not
   the design; this needs Bryan's word.
7. Would Bryan own a Cloudflare account (card on file) as the fallback?
8. Before or after destination A ("give it to a hive dev for review")?
   Round-2 Q5 says (c) "as first map after A ships"; this note does not
   change that.

---

## 11. Proposals

PROPOSAL 1, the shape: one tiny relay (`ws`, Node 20+), in-memory only,
verify once at connect, nearest-N fan-out, binary frames from day one. First
home wherever a box exists (3speak if Meno agrees), Cloudflare Durable
Objects as the written fallback. The Denser side is a client behind one env
var that degrades to solo play when unset or unreachable, so the game merges
and ships as today until the URL is filled in.

PROPOSAL 2, where the code lives: a new workspace app in this monorepo, so
the existing `Dockerfile` builds it like `blog` and `wallet`
(`TURBO_APP_SCOPE`, `docker-bake.hcl`) and the reviewer reads relay and
client in one MR. Needs Bryan's yes: it is a new folder.

PROPOSAL 3, the message: send on change plus a 1 Hz heartbeat, not 5 Hz
always. Clients predict rail motion from edge, t, direction and
`MOVE.SPEED`; `movement.ts` stays frozen, prediction only reads it.

PROPOSAL 4, identity: posting-key challenge through Denser's `signChallenge`
(one prompt per session), verified on the relay with the login's own
recover-and-compare. Keep the HMAC-token variant for the day the relay is run
by the same people as the blog.

PROPOSAL 5, the promise, in the relay README so a reviewer checks it in a
minute: stores nothing on disk, logs no positions, forwards only the six
fields in section 6, one socket per account, drops anyone over 10 messages a
second.

PROPOSAL 6, names: ship the switch, not the answer. A `pseudonymous` setting
on the relay from day one, and the client draws both a named and a nameless
bug, so Bryan and Percy can playtest both feelings before choosing.
