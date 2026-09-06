# Hive history, culture and jargon: what is real, and what it could become in H.I.V.E.R.

Research file 02. Written 5 September 2026 against primary sources: hive.io, the
Hive whitepaper, the Hive developer docs, and hive.blog posts by the people who
were there. News sites (CoinDesk, Decrypt, Cointelegraph) are used only for the
2020 takeover timeline and are marked as news each time. Nothing in this file is
a decision. Every game idea is marked PROPOSAL. The game is read against
`apps/blog/features/hive-frontend-universe/README.md`, its `HANDOFF.md` lore
section, and the code. `HANDOFF.md` is an AI paraphrase of the owner's words and
is never quoted here as his words.

Glossary words from `features/basecamp/CONTEXT.md` are used throughout: new
user (account under a year old), OG user (a year or older), curator (anyone
weighing an account by looking at it), guide, support, reply, patrol.

---

## 1. Summary

- Hive began on 20 March 2020 when the Steem community forked away after Tron's
  Justin Sun bought Steemit Inc and its huge "ninja-mined" stake (the @hiveio
  launch post and the whitepaper both say so).
- The game's myth is right on the big facts: a bought company, a hoarded stake,
  fake witnesses, a community that left. It is loose on details: 20 puppet
  witnesses not 21, the 21st seat rotates, Steem is still running, and the
  White Knight's rescue failed.
- Hive's mechanics are its culture: witnesses, Hive Power and the 13-week power
  down, Resource Credits, the 7-day payout, the 50/50 reward split, the DHF and
  its return proposal, reputation, downvotes.
- The rank words (redfish to whale) come from tools, not the chain. SteemPlus
  code set the numbers and SteemitBoard (now HiveBuzz) added "redfish" in 2017
  because "dolphin" looked too far away for new users.
- Rituals: Power Up Day on the 1st (started on Steem in 2019 by @streetstyle,
  carried to Hive by @traciyork), HiveBuzz badges, HiveFest once a year.
- The jokes are mostly about the reward pool: circle jerks, bid bots, self
  votes, milking, flag wars. Each is a true story with a date.
- Blurt (July 2020) is the chain with no downvotes, and with fees. Its own 2024
  promo post on Hive drew the reply that mass tagging is exactly why downvotes
  exist.
- Hive's games: Splinterlands hit 50,000 daily players in 2021 and was near
  8,000 by late 2024 after bot bans and the bear market. dCity and Rising Star
  shrank with their token prices. Rising Star closed in its original form in
  2026.
- Section 6 lists ten places where the game invents something the chain already
  provides. The NEWBS counter and the fixed 21 helmets lead the list.
- Section 7 holds the open questions for Bryan.

---

## 2. The fork, as a dated timeline

Terms used below. A **witness** is an elected server that signs blocks; it is
Hive's word for a block producer. **Steem Power (SP)** and **Hive Power (HP)**
are coin that has been staked, meaning locked, and that carries voting weight.
A **soft fork** restricts what is allowed without changing the chain's rules;
nodes that do not upgrade still follow it. A **hard fork** changes the rules so
old nodes cannot follow. A **proxy** is an account you hand your witness votes
to. **Steemit Inc** was the company that made the first Steem website.

| Date | What happened | Source |
|---|---|---|
| 23 or 24 Mar 2016 | The Steem chain starts, with almost no notice. The founders (Ned Scott and Dan Larimer) and insiders mine most of the early supply. This pile becomes the "ninja-mined stake". Sources differ by a day on the start date. | Decrypt (news), https://decrypt.co/38050/steem-steemit-tron-justin-sun-cryptocurrency-war ; Steem Center, https://www.steem.center/index.php?title=Steemit |
| 4 Jul 2016 | Steemit pays out its first rewards. About 1.3 million dollars in STEEM and Steem Dollars. | Steem Center (above); Wikipedia, https://en.wikipedia.org/wiki/Steemit |
| 21 Jul 2016 | @anyx launches the @cheetah bot, which comments a source link on copied posts and does not flag. | https://hive.blog/steemit/@anyx/cheetah-bot-the-fight-against-spam-and-plagiarism-continues |
| 20 Jun 2017 | Hardfork 19 "Equality": linear rewards, "1 Steem Power, 1 vote". | https://steemit.com/steemit/@steemitblog/hf19-equality-coming-soon-linear-rewards (search summary only) |
| 14 Dec 2017 | SmartSteem, a bid bot run by @therealwolf, launches. Bid bots are the era's defining business. | https://hive.blog/steem/@smartsteem/introducing-smartsteem-s-bid-bot-and-smartmarket |
| 25 Sep 2018 | Hardfork 20 "Velocity": Resource Credits replace bandwidth. New accounts with tiny stake can barely post. | https://hive.blog/steem/@steemitblog/steem-velocity-hardfork-hardfork-20 |
| 27 Aug 2019 | Hardfork 21: the proposal system (SPS, later the DHF) funded by 10 percent of inflation, the 50/50 author and curator split, and a free downvote pool. Aimed at bid bots and self voting. | https://hive.blog/steem/@steemitblog/hf21-sps-and-eip-explained |
| 14 Feb 2020 | Tron Foundation buys Steemit Inc. The stake is about 65 to 70 million STEEM, roughly 20 percent of supply. | CoinDesk via Yahoo (news), https://finance.yahoo.com/news/justin-sun-bought-steemit-steem-230126090.html ; https://hive.blog/steem/@lukestokes/how-steem-became-hive |
| 20 Feb 2020 | Steemit ships Communities (hivemind, "hive-xxxxxx" names, owner, admin, moderator roles). The Hive name for communities predates the Hive chain. | https://hive.blog/steemit/@steemitblog/communities-have-arrived |
| 23 to 24 Feb 2020 | Soft fork 0.22.2. The witnesses block twelve operations (voting, witness votes, proxy, power down, transfers, market orders, savings, escrow) for five Steemit Inc accounts: misterdelegation, steem, steemit, steemit2, steemitadmin. Described as temporary and reversible. Signed in comments by blocktrades, gtg's peers, roelandp, therealwolf, acidyo, guiltyparties, aggroed, yabapmatt and others. | https://hive.blog/steem/@softfork222/soft-fork-222 ; https://hive.blog/hive-111111/@therealwolf/steem-protective-soft-fork-v0-22-2 |
| 2 Mar 2020 | Steemit Inc runs 0.22.5 to undo the freeze and installs 20 new witnesses. Binance, Huobi and Poloniex power up customer STEEM and proxy their votes to @dev365. Over 100 million STEEM is voted this way. Steemit's open letter promises to hand governance back "after the 4-6 weeks period". | https://hive.blog/tron/@steemitblog/an-open-letter-to-the-community-hf22-5 ; https://hive.blog/steem/@pfunk/the-exchanges-used-by-justin-sun-to-attack-steem-part-1-boycott |
| 3 Mar 2020 | Binance and Huobi withdraw their votes and say they were told the chain was under attack. Their customers' STEEM stays locked for 13 weeks. Sun tweets that "hackers" were defeated. | CoinDesk (news), https://www.coindesk.com/tech/2020/03/03/steem-community-mobilizes-popular-vote-in-battle-with-justin-sun/ ; Decrypt (news, above) |
| 4 to 16 Mar 2020 | A voting war. The community briefly holds 10 of the top 20 seats. On 16 March Binance releases 2.6 million STEEM to Sun and he retakes all 20. A witness later says Sun offered 2,500 dollars a month to run a witness for him. | Decrypt (news, above); Cointelegraph (news), https://cointelegraph.com/news/justin-sun-accused-of-bribing-his-way-to-the-top-of-the-steem-hierarchy |
| 18 Mar 2020 | @hiveio announces Hive: launch at 14:00 UTC on Friday 20 March, 1:1 airdrop (STEEM to HIVE, SBD to HBD, SP to HP), "over 30 experienced developers", and a 30-day delay before new stake can vote on witnesses or proposals. Excluded: accounts holding the ninja-mined stake and those who "actively contributed to (and publicly declared support for) the centralization". | https://hive.blog/communityfork/@hiveio/announcing-the-launch-of-hive-blockchain |
| 20 Mar 2020 | Hive goes live. Hive-side this is hardfork 23. The exclusion list: about 14 Steemit Inc accounts, about 20 puppet witnesses, and roughly 400 accounts with over 1,000 SP that voted two or more puppets (or proxied to someone who did) and did not unvote before the announcement. About 450 in all. | https://hive.blog/neoxian/@neoxian/the-list-of-accounts-that-are-being-excluded-from-hive ; https://hive.blog/steem/@lukestokes/how-steem-became-hive |
| Late Mar to May 2020 | @hiveio corrects a script bug that wrongly excluded 30 accounts. The withheld airdrops sit in the DHF, an account with no keys, and the community votes on secondary airdrop proposals, including a "no additional airdrops" proposal. | https://hive.blog/hiveblockchain/@hiveio/community-discussion-updates-hive-airdrop-exclusion-core-developer-meetings ; https://hive.blog/hiveblockchain/@hiveio/hive-secondary-airdrop-no-additional-airdrops |
| 4 Apr 2020 | Steem's new witnesses freeze eight accounts holding 3.2 million dollars of STEEM. | Decrypt (news, above); CoinDesk (news), https://www.coindesk.com/tech/2020/04/05/steem-witnesses-freeze-32m-in-latest-tit-for-tat-with-hard-fork-insurgents (title only, page rate-limited) |
| 28 Apr 2020 | HiveBuzz launches, carrying SteemitBoard's badges to Hive. | https://hive.blog/hivebuzz/@hivebuzz/hivebuzz-hive-gamification-experience |
| 20 May 2020 | Steem hardfork 0.23 moves about 23.6 million STEEM from 64 accounts (freedom 10.7M, mottler, blocktrades 1.99M, safari, darthknight and others) to @community321. Within minutes an unknown person with that account's keys sends it all to Bittrex with the memo that these are stolen funds, please return them, and then posts "Stealing is bad" in Korean. Bittrex keeps the coins as @community321 property, citing chain consensus. | https://hive.blog/steem/@penguinpablo/steem-hardfork-seizes-over-22-million-steem-power ; https://hive.blog/steem/@apshamilton/justin-sun-thwarted-a-white-knight-saves-the-steem-stolen-by-hf0-23-by-sending-to-bittrex ; Decrypt (news), https://decrypt.co/29626/a-daring-plan-to-save-5-million-of-cryptocurrency-steem-failed |
| 1 Jun 2020 | Splinterlands moves its chain of record from Steem to Hive. It had taken HIVE and HBD since 30 March. | https://hive.blog/splinterlands/@splinterlands/hive-migration-and-other-updates ; https://docs.splinterlands.com/company/timeline/history-2020 |
| 4 Jul 2020 | Blurt launches as a second Steem fork: no downvotes, no SBD, transaction fees set by witnesses, and a "regent" account with a controlling stake that decays to zero over two years. | https://hive.blog/steem/@vikisecrets/new-steem-fork-is-coming-blurt-is-this-another-justin-sun-controlled-chain-who-is-behind-the-regent-account ; https://raw.githubusercontent.com/Blurt-Blockchain/blurt/dev/README.md |
| 28 Sep 2020 | The Hive whitepaper is dated. It calls Hive "a direct result of a 51% attack on the Steem blockchain committed by the founding company Steemit Inc." and says the migration was "the first time in blockchain history that a full-scale migration was applied as a mitigation". | https://hive.io/whitepaper.pdf |
| 14 Oct 2020 | Hardfork 24 "Eclipse" (planned for 6 October, delayed): a rewritten code base, Steemit Inc's stake moved to the DHF, airdrop corrections. | https://hive.blog/@hiveio/has-the-eclipse-happened-explaining-how-hive-hardforks-work-and-activating-hf24-on-october-14th |
| 30 Jun 2021 | Hardfork 25 "Equilibrium": the 5-minute early-vote penalty ends, curation is linear for the first 24 hours, HBD interest is paid only on savings, HIVE can be converted to HBD, and witness and proposal votes expire after a year of inactivity. | https://hive.blog/hive/@hiveio/hive-hardfork-25-is-on-the-way-hive-to-reach-equilibrium-on-june-30th-2021 |
| Apr 2022 | Top witnesses lift the HBD savings rate to 20 percent a year. | https://hive.blog/hive-167922/@phortun/the-potential-of-the-hbd-savings-interest-rate-raised-to-20 (search summary only) |
| 11 Oct 2022 | Hardfork 26 "Evolution": Resource Credit delegation, one-block irreversibility, HBD cap moved to 30 percent of market cap. | https://hive.blog/hive/@hiveio/the-evolution-of-hive-hardfork-26 |
| Aug 2023 | @gtg starts lowering his HBD rate parameter toward 10 percent and explains the rate is the median of the top witnesses' settings. | https://hive.blog/hive-160391/@gtg/gtg-witness-update-upcoming-changes-in-hbd-apr |
| 2026 | Steem still runs and trades: about 0.045 dollars, 2.9 million dollars daily volume, rank 571 on 5 Sep 2026. Hive's own site counts 158 apps, 248 communities and 10 HiveFests. | https://coinmarketcap.com/currencies/steem/ ; https://hive.io/ |

### What the game already got right, and where it is loose

Checked against README "The creatures and the lore" and the HANDOFF lore section.

Right:

- "A new owner tried to take over the old chain with a ninja-mined stake, and
  the community forked away and built Hive." True in every part (whitepaper,
  @hiveio launch post, therealwolf, tarazkp).
- Sock puppets as the Emperor's tools. The 20 installed witnesses were called
  sock puppets at the time by the community and by @hiveio's own exclusion
  criteria ("sockpuppet Steem witness accounts").
- The Steem Ruins link to the real launch post. That post is the primary
  source for the airdrop rules and the 30-day governance delay.
- The 21 citadels are pulled live from `get_witnesses_by_vote`. Witness cards
  show version, last block, missed blocks, HBD savings rate, price feed,
  account fee and block size. All real chain fields.
- A White Knight who tried to return what was stolen. Real: 20 May 2020,
  @community321, Bittrex.

Loose or wrong:

- "The old world was bought." Sun bought Steemit Inc, a company, and its stake.
  Nobody can buy the chain. The chain was captured by votes, using exchange
  customers' coins.
- "Seized the 21 thrones with sock puppets." Twenty. The 21st seat is not a
  throne: it is one shared slot that rotates among backup witnesses in
  proportion to their votes (whitepaper III.3, hive.blog FAQ).
- "One helmet per consensus witness, 21 in all." The whitepaper says 20
  consensus witnesses. The 21st helmet belongs to whoever holds the rotating
  seat this window.
- "Left him an empty shell." Steem is live and traded in 2026. The Ruins are a
  Hive-side view, which is fine for gameplay, but the museum should say Steem
  continues.
- The White Knight "returns what was stolen." The rescue failed. Bittrex kept
  the coins for @community321, and a lawsuit followed. If this becomes a quest,
  the honest version is a helper who tries.
- HANDOFF says "Blahs cannot be flagged away because where they come from
  there is no downvote." Correct for Blurt, and Blurt also charges fees for
  every action, which Hive does not. A second gag is available.
- HUD label `hud.newbs` ("NEWBS") uses a word the glossary avoids. The chain
  provides account age; the glossary provides "new user".
- The daily "BUZZING STATION" borrows HiveBuzz's word "buzz" (HiveBuzz
  "buzz[es] you when you reach some predefined thresholds"). Possibly intended;
  worth knowing.

---

## 3. Catalogue

Columns: the Hive fact or word | what it really is | source | already in the
game? | possible game trope (PROPOSAL, one line). "Yes" answers name the file
or lore line. Every row of the last column is a proposal, even where the word
PROPOSAL is dropped for space.

### 3a. Governance and blocks

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| Witness | An elected server that signs blocks and votes on rule changes. "The community elects 'witnesses' to act as the network's block producers and governance body." | https://hive.blog/faq.html | Yes: Witty World, 21 citadels, helmets, witness card (`engine/helmets.ts`, `card/landmark-panel.tsx`) | Keep as the guardians. |
| Top 20 plus one | 20 full-time witnesses produce blocks each 63-second round; a 21st slot is shared by backups in proportion to their votes. | https://hive.blog/faq.html ; whitepaper III.3 | Partly: the game treats all 21 as equal | The 21st helmet is a "wandering helmet" that belongs to a different backup witness each window. |
| 30 witness votes per account | "Every account may select up to 30 witnesses for approval." | Whitepaper III.3 | No | A read-only "cast your thirty" plaque at Witty World that opens the real witness page. |
| 17 of 20 to change the rules | "Hardforks and key protocol changes are accepted by 17 out of 20 consensus witnesses." | Whitepaper III.2 ; HF24 post | No | Lore line: the world only changes when 17 towers light at once. |
| 3-second blocks | Blocks every three seconds. hive.io: "produce blocks every 3s". | https://hive.io/ ; whitepaper III.3 | Yes: "three-second heartbeat" in the creation myth | Keep. |
| 63-second round | 21 slots times 3 seconds. | https://hive.blog/faq.html | No | The citadel light beams sweep the ring once every 63 seconds, in real time. |
| Missed blocks | A witness that fails to sign is "recorded on chain as have missed a block". | Whitepaper III.3 | Yes: witness card readout | Keep as readout. No verdict. |
| Fee-less transactions | "zero fees and near-instant transactions". | https://hive.io/ | No | A sign at Hive Comb Home: "no toll booths on this planet". |
| No owner | hive.io: owned by "no one", "governed by everyone". | https://hive.io/ | Yes: builders "left the code open, departed" | Keep. |
| The 30-day governance delay | New stake cannot vote on witnesses or proposals for 30 days. Added at launch to stop a repeat attack. | https://hive.blog/communityfork/@hiveio/announcing-the-launch-of-hive-blockchain | No | Lore: "no one sits a throne in their first month", said by a citadel keeper. |
| Votes expire after a year idle | HF25: witness and proposal votes of accounts inactive for a year stop counting. | HF25 post (above) | No | Museum line only. |
| Hardfork names | Eclipse (HF24), Equilibrium (HF25), Evolution (HF26). | HF24, HF25, HF26 posts | No | Name the game's seasons or passes after them. |
| One-block irreversibility | HF26: a block is final within milliseconds once a supermajority signs. | HF26 post | No | Museum line only. |

### 3b. Money and stake

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| HIVE, HP, HBD | HIVE is liquid coin; Hive Power is staked HIVE; HBD is a dollar-pegged token. | Whitepaper II.1 | Partly: HBD savings rate on the witness card | Three colours of coin on the map, named by their real names. |
| Power up | Staking HIVE into HP. | Whitepaper II.1 | No | The HPUD festival (already a README candidate). |
| Power down, 13 weeks | Unstaking pays out "in equal amounts over 13 weeks period, with a segment delivered every 7 days". | Whitepaper II.1 ; https://hive.blog/faq.html | No | A 13-step tide that recedes one step a week; a slow river out of the world. |
| Delegation | Lending HP's votes and Resource Credits to another account. The owner keeps the coin. | https://hive.blog/faq.html | No (3 code mentions) | Later, multiplayer: lend spare air to another bug for a window. |
| Resource Credits (RC) | A rechargeable allowance replacing fees. Refills 20 percent per day. Every action costs some. Introduced by HF20 in Sept 2018. | Whitepaper II.2 ; HF20 post | Not by name: oxygen and spare air are the same shape | Label oxygen as RC in one tooltip. The chain already has this mechanic. |
| The RC crisis | After HF20 new accounts with 3 SP could not post more than once and could not reply to comments on their own intro. | Search summary of https://steemit.com/steem/@steemitblog/hf20-update-hardfork-successful and community posts | No | Museum plaque: the day new users could not speak. |
| RC delegation | HF26: an account can delegate RC alone. | HF26 post | No | Same as delegation above. |
| Reward pool split | Inflation: 65 percent to the reward pool, 15 percent to HP holders, 10 percent to witnesses, 10 percent to the DHF. | Whitepaper II.4 | No | A four-spout fountain in the DHF Fun Park; visual only. |
| 50/50 author and curator | Since HF21 (Aug 2019) half of a post's reward goes to voters. | Whitepaper V.6 ; HF21 post | No | Explains why "support" by upvote pays the supporter too. Card readout, no verdict. |
| 7-day payout | "a piece of content will be monetizable for a period of 7 days". | Whitepaper V.5 | No | Post markers ripen visibly toward day 7 and then drop their fruit. |
| Curation window history | Early-vote penalty: 30 min, then 15 (HF20), then 5 (HF21), then removed (HF25, linear first 24 hours). The hive.blog FAQ still describes the 5-minute rule. | HF20, HF21, HF25 posts; https://hive.blog/faq.html | No | Museum only. Flag the stale FAQ upstream. |
| Vote mana | Full recharge takes 5 days; about 10 full votes a day. | https://developers.hive.io/tutorials-recipes/understanding-configuration-values.html | No | None. The game never votes. |
| HBD savings | 3-day withdrawal. Interest paid only on savings since HF25. Rate is the median of the top witnesses' settings: 3 to 10 to 12 to 20 percent (Apr 2022), later lowered. hive.io shows 15 percent in 2026. | https://hive.blog/faq.html ; HF25 post; gtg post; https://hive.io/ | Yes: witness card "HBD savings APR" | A vault at the fun park whose sign shows the live rate. |
| HBD conversion | HBD to HIVE takes 3.5 days at the median price. | https://hive.blog/faq.html | No | None. |
| Hive Engine tokens | A second layer on Hive that issues tokens like SIM (dCity) and STARBITS (Rising Star). | https://hive-engine.com/ (title only); gerber post; Rising Star post | Partly: TribalDex link in the dApp list | None yet. |

### 3c. The DHF

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| DHF (Decentralized Hive Fund) | 10 percent of inflation, paid out hourly to proposals ranked by stake votes. Proposals list is at /proposals. | Whitepaper II.5 ; https://hive.blog/@gtg/dhf | Yes: DHF Fun Park ferris wheel | Keep. |
| Return proposal (id 0) | A proposal with a huge daily ask. Anything below it is unfunded; what reaches it goes back to the fund. "the level which a project has to exceed to receive funding". | https://hive.blog/@gtg/dhf | No | The fence height a gondola must clear; or the empty gondola that always goes back down. |
| HBD stabilizer | A DHF-funded bot (@hbdstabilizer, proposal 264) that trades to hold the peg and returns profit to the DHF. | https://hive.blog/hbd/@smooth/hbd-stabilizer-evolution-may-2023 | No | A tightrope walker at the fun park who never falls. |
| Proposal fee | Creating a proposal costs 10 HBD. | Config values page (above) | No | Ticket booth price. |
| Steemit's stake in the DHF | HF24 moved Steemit Inc's HIVE to the DHF. By Oct 2021 the DHF held 69 million HIVE, 19 percent of supply. | HF24 post; https://hive.blog/hive-167922/@dalz/hive-power-up-and-power-down-or-historical-data-by-day-months-and-top-accounts-4rh2sg | No | The Emperor's hoard, on Hive, became a keyless public vault. Show the real number at the park. |

### 3d. Social layer

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| Reputation | Starts at 25, log scale ("40 is about 10x better than 30"). Only downvotes from higher reputation can lower it. Below 0 hides posts. | https://hive.blog/faq.html | 7 code mentions (house cards) | Readout only; never a verdict. |
| Downvote, flag | Anyone may downvote "for any reason". Since HF21 a separate pool gives free downvotes worth 25 percent of upvote mana. | https://hive.blog/faq.html ; HF21 post | Yes, by absence: Blahgart comes from a place with none | Keep. |
| Flag war | Late 2017 to 2018: @berniesanders downvoted @haejin, who posted many times a day and drew about 1 percent of the reward pool; @ranchorelaxo upvoted him back. Bots on both sides. | https://hive.blog/steemit/@znog/steem-wars-berniesanders-vs-haejin | No | Two stone whales locked mid-fight in the Steem Ruins. No names. |
| Communities | Launched 20 Feb 2020 on Steem: hive-xxxxxx ids, owner, admin, moderator, member, muted. | https://hive.blog/steemit/@steemitblog/communities-have-arrived | Yes: top page of `bridge.list_communities` | Keep as places; HANDOFF says nothing may depend on their tooling. |
| Trending | The page bid bots bought their way onto. "Trending" is a battleground word on Hive. | aggroed, lexiconical posts (3e) | Yes: /trending in the Comb | Keep as a plain link. |
| Curation trail | A service (SteemAuto, now hive.vote) that copies a curator's votes for followers. "The trail followers will follow the upvotes of the leading account." | https://hive.blog/hive-vote/@steemauto/hivevote-free-and-unlimited-automation-service-on-hive | No | A rail that follows a real curator's votes for one window. Read-only. |
| Fanbase | The same service: auto-upvote an author on publish. | Same | No | None. |
| Reblog | Sharing a post to your feed. | https://hive.blog/faq.html | No | None. |
| Verification | Hive's word for proving you are who you say (link on another site, photo with username). | https://hive.blog/faq.html | No, and HANDOFF forbids trust logic until the trust conversation | None. Do not build. |

### 3e. Ranks and rituals

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| Redfish, minnow, dolphin, orca, whale | Size ranks by staked coin, measured in VESTS: minnow 1M, dolphin 10M, orca 100M, whale 1,000M VESTS. Set in SteemPlus code; SteemitBoard used the same. | https://hive.blog/steem/@dhimmel/steem-vest-ranks-plankton-minnow-dolphin-orca-whale ; https://hive.blog/hivebuzz/@hivebuzz/hivebuzz-hive-gamification-experience | No | Your fish shows on your own card. New users start as redfish. Readout, not verdict. |
| Redfish origin | SteemitBoard added "redfish" in June 2017 because new users said "dolphin" looked out of reach. Plankton was the older bottom rank. | https://steemit.com/redfish/@albertvhons/steemit-introduce-the-new-level-redfish (search summary only); dhimmel post | No | The red bug is already red. A line of lore: "every bug starts as a redfish". |
| Whale | A very large stakeholder. Also the rank. | dhimmel post | No | A whale silhouette passing under the sea, visible, unreachable. |
| HiveBuzz badges | Since April 2020 (as SteemitBoard since 2017, by @arcange). Activity badges (posts, comments, upvotes, payout, followers, replies), personal badges, meetup badges (HiveFest), ranking badges ("Daily Top Upvoted"). Comments a "buzz" on your last post. | https://hive.blog/hivebuzz/@hivebuzz/hivebuzz-hive-gamification-experience ; https://docs.hivebuzz.me/ | No (README candidate) | Badge-shaped achievements in the HiveBuzz idiom. Ask HiveBuzz first (collaboration). |
| HPUD, Hive Power Up Day | The 1st of each month. Started on Steem in April or May 2019 by @streetstyle as SPUD; carried to Hive by @traciyork from July 2020. Prize rules in 2021: reputation 39 to 70, HP 100 to 8,000, power up at least 10 HIVE, post with #HivePUD, ranked by percentage powered up. | https://hive.blog/hive-167922/@traciyork/welcome-to-hivepud-hive-power-up-day-july-1st-2021 | No (README candidate) | Monthly festival on the 1st; the buzzing station parks at the wallet. |
| Power-bee badge | HiveBuzz badge for powering up at least 100 HIVE on the 1st (UTC). "powering-up 0.001 HIVE won't make the trick". | https://hive.blog/hivebuzz/@hivebuzz/pud | No | Festival token. |
| Power Up Helper | Badge for powering up at least 10 HIVE to a smaller account on the 1st. "The helper must have more HP than the helpee." | https://hive.blog/@hivebuzz/pud-helper | No | Later: a gift, through `transactionService`, never auto. |
| Power Up Month | Since Sept 2021: every day, post at 100 percent HP payout or power up at least 1 HIVE; no power down. | https://hive.blog/hivebuzz/@hivebuzz/pum | No | A 30-day streak ring. |
| HiveFest | Yearly gathering since SteemFest 2016 (Amsterdam), Lisbon 2017, Krakow 2018, Bangkok 2019, virtual 2020 and 2021, Amsterdam 2022, Kuala Lumpur 2025, Barcelona 17 to 20 Sept 2026 (HiveFest XI). hive.io: 10 editions, 1,200 plus participants. Run by @roelandp. | https://hivefe.st/ ; https://hive.io/ ; https://hivefe.st/2022/index.html (search summary) | No | A fair tent that pitches for HiveFest week only. |
| Hive birthday | HiveBuzz marks account anniversaries with a badge. | HiveBuzz post (personal badges) | No | A candle on the bug on its account birthday. |

### 3f. Patrol words

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| Cheetah | @anyx's bot since July 2016. Comments the likely source of copied text. "does NOT flag posts it thinks are plagiarized". | https://hive.blog/steemit/@anyx/cheetah-bot-the-fight-against-spam-and-plagiarism-continues | No (Copypasta is the spam creature) | A cheetah that points and never bites. Copypasta's natural enemy. |
| Steemcleaners, Hivewatchers | Anti-fraud team since 2016; renamed at the fork. Handles plagiarism, identity theft, post recycling, phishing. 10,844 valid reports from Aug 2020 to 2022. Blacklist consulted by apps. | https://hive.blog/hive/@hivewatchers/the-hivewatchers-and-spaminator-operational-proposal-for-the-period-2022-2024 | No | A lighthouse whose keeper only answers questions. |
| Spaminator | A bot that leaves "a tiny dust warning vote" on abuse; 471,220 downvotes by 2022; manually reviewed. Run by @guiltyparties. | https://hive.blog/hivewatchers/@guiltyparties/regarding-hivewatchers-and-spaminator ; 2022-2024 proposal | No | A small pinging buoy. |
| The blacklist | Hivewatchers' list. Appeal: come to Discord, post titled "MY HIVEWATCHERS BLACKLIST. MY APOLOGY TO THE HIVE COMMUNITY", post original work for a period. | https://hive.blog/hivewatchers/@hivewatchers/appealing-the-hivewatchers-blacklist | No | None. HANDOFF forbids flagging real accounts. |
| @null, the burn barrel | Sending rewards to @null destroys them. "ALL REWARDS GO TO @NULL THE BURN BARREL". | Same appeal post | No | A furnace at the Ruins' edge where a bug may drop tokens to watch them burn. Cosmetic. |
| Sock puppet | A fake account run by someone else. In 2020, the 20 installed witnesses. | https://hive.blog/steem/@pfunk/the-exchanges-used-by-justin-sun-to-attack-steem-part-1-boycott ; @hiveio exclusion post | Yes: Socko, Mount Socko | Keep. |
| Identity theft | Posting as someone else, a Hivewatchers category. | 2022-2024 proposal | No | Sock or Not already plays this. |
| AI content policy | Since 2022 Hivewatchers treats undisclosed AI text as not original; "At least 50% of writing in the post should be original". Contested in comments. | https://hive.blog/ai/@hivewatchers/ai-generated-content-not-original-content | No | None yet. Open question. |
| Steem milkers, dual posting | 2020: the same post on both chains for two payouts. @arcange's hourly blacklist reached 2,461 accounts; strong pushback; later an apology post. | https://hive.blog/anti-abuse/@arcange/dualpost-blacklist-identifying-steem-milkers-on-hive | No | Museum only. Too raw for a creature. |
| Extractor | Basecamp's own word for an account that earns and leaves. ETHOS: "Earning on Hive and taking your earnings out is not wrongdoing". | `features/basecamp/ETHOS.md` | Yes: Drainiac | Keep, and keep ETHOS's line in the creature's card. |

### 3g. The fork, as words

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| Ninja mine | Steem launched with little notice in March 2016 and insiders mined most of the supply. "one set of miners had designed and set up the system to have an unfair advantage". | https://hive.blog/hive-174578/@tarazkp/steem-softforking-exchanges-security-and-mining-ninjas ; whitepaper I | Yes: README lore | Keep. |
| The social contract | Steemit Inc promised to use the stake for development, not governance. The whitepaper: "kept in check by the means of a social contract". | Whitepaper I; tarazkp post | No | A cracked stone tablet in the Ruins. |
| Steemit Inc's stake | About 65 to 70 million STEEM, near 20 percent of supply. | CoinDesk via Yahoo (news, above) | Yes: the hoard | Show the real figure in the keep's card. |
| Soft fork 0.22.2 | 23 to 24 Feb 2020. Twelve operations blocked for five accounts. "This update is reversible". | https://hive.blog/steem/@softfork222/soft-fork-222 | No | The museum's first exhibit. |
| @dev365 | The proxy account exchanges pointed their customers' votes at. | pfunk post (above) | No | The Emperor's herald; the hub the puppet strings run to. |
| The exchanges | Binance, Huobi, Poloniex powered up customer coin and voted, then two apologised. Customers were locked for 13 weeks. "No one thought Binance would lock up its Steem for 13 weeks" (Matt Rosen). | pfunk post; Decrypt (news) | No | Three bank vaults with 13 padlocks each. |
| HF22.5 and "4-6 weeks" | Steemit's letter of 2 Mar 2020 promised to return governance "after the 4-6 weeks period". | https://hive.blog/tron/@steemitblog/an-open-letter-to-the-community-hf22-5 | No | A sign on the keep: "Back in 4 to 6 weeks." Still up. |
| The 20 puppet witnesses | Named on chain and in the exclusion list (goodguy24, coronashallgo, hunger365 and 17 more). | Cointelegraph (news), https://cointelegraph.com/news/steem-community-resists-takeover-hard-fork-launches-hive-network (search summary) ; neoxian list | Yes, as species | Open question 4 before naming any. |
| Airdrop and exclusions | 1:1 airdrop; about 450 excluded; 30 wrongly, later fixed; secondary airdrops put to a vote. | @hiveio posts (timeline) | Partly: the Ruins link | Museum. |
| Hardfork 23 (Hive side) | Hive's launch fork. | https://hive.blog/steem/@lukestokes/how-steem-became-hive | No | None. |
| Hardfork 0.23 (Steem side) | 20 May 2020: 23.6 million STEEM seized from 64 accounts into @community321. | penguinpablo post | No | The Emperor's last grab; the Ruins' final room. |
| The White Knight | Unknown holder of @community321's keys who sent the seized coin to Bittrex with a return-it memo and "Stealing is bad" in Korean. Bittrex refused. | apshamilton post; Decrypt (news) | Yes, parked in HANDOFF | A helper who tries to bring back what thieves dropped down troll holes, and sometimes cannot. |
| "Hackers" and "SAFU" | Sun's 3 Mar 2020 tweet: the chain "defeated the hackers" and funds are "super #SAFU". | Decrypt (news, above) | No | The Emperor's victory banner, misspelt. |
| Blurt | Steem fork of 4 July 2020: no downvotes, no SBD, per-action fees set by witnesses, regent account decaying over 24 months. Named for blurting. | vikisecrets post; Blurt README | Yes: Blahgart | Add the fee gag: Blahgart charges a toll to be ignored. |
| "This is why we need downvotes" | Oct 2024: a Blurt promo post on Hive mass-tagged communities; a reply: "the mass tagging you just did illustrate perfectly why we do need downvotes". | https://hive.blog/blurt/@blrtannouncement/blockchain-without-downvotes-at-your-fingertips | No | Blahgart's slime is a wall of tags. |
| Justin Sun | Tron's founder, the buyer. Folk villain on Hive. | All of the above | Yes: Emperor J SON | Keep the pun; put the real name in the museum only. |
| "The community forked away" | Hive's self-image; whitepaper: first full-scale migration used to survive a 51 percent attack. | Whitepaper II.5 footnote | Yes: the Fall and Migration | Keep. |

### 3h. Hive's own games

| Hive fact or word | What it really is | Source | Already in the game? | Possible game trope (PROPOSAL) |
|---|---|---|---|---|
| Splinterlands | Card battler. Steem Monsters 26 May 2018; battles from 14 Oct 2018; Hive from 1 Jun 2020; 50,000 daily players 10 Aug 2021; about 8,000 by Nov 2024. | Section 5 sources | Yes: arcade list | Keep. |
| dCity | City builder on Hive Engine by @gerber; SIM token; top ranks paid in HIVE until July 2023, then SIM. | Section 5 sources | No | Add to the arcade list if it is still live (open question). |
| Rising Star | Music career game since 2020; STARBITS and STARPRO tokens; closed in its original form in 2026 and handed to Blockchain Gaming (@wagginston). | Section 5 sources | Yes: arcade list | Check the link still works; note the handover. |
| Bots in games | Splinterlands banned bots from Modern ranked in July 2023; battles fell from 500k to 100k a day in June 2024 after more anti-bot steps. | Section 5 sources | No | Spot the Bot already plays this. |

---

## 4. The running jokes and truisms

Each entry: what people say, where it came from, and a "truth in comedy" note
on the real behaviour behind it.

**Circle jerk.** A ring of accounts that upvote each other regardless of what
was posted. @lexiconical used the term on 1 July 2017 while showing a holiday
rental marketer's spam sitting in trending on two whale votes.
Source: https://hive.blog/curation/@lexiconical/exposing-advertiser-circle-jerks-in-trending-reward-pool-rape-and-bookingteam-com
Truth in comedy: the reward pool is shared, so a closed loop of votes takes from
everyone outside it. The chain lets you see who votes for whom.

**Reward pool rape, reward pool abuse, milking.** The 2017 phrase was crude;
"abuse" and "milking" replaced it. All mean drawing rewards out of the shared
pool with no value going back in. @theycallmedan, arguing for free downvotes
in July 2019: bid-bot users are "essentially taking money from every other user
on the platform".
Sources: lexiconical (above); https://hive.blog/downvote/@theycallmedan/free-downvotes-are-comming
Truth in comedy: every payout is a share of one pot. Drainiac is this joke.

**Bid bots.** From late 2017 to 2019 you sent SBD to a bot with your post link
in the memo and got an upvote in the next round. SmartSteem launched 14 Dec
2017 and voted "every 2.4h on sent bids". Its own founder wrote a guide showing
two users who spent about 140 SBD each and got back under 20: an 88 percent
loss. HF21 (Aug 2019) made downvotes free and the model collapsed; SmartSteem
moved to manual curation within days.
Sources: https://hive.blog/steem/@smartsteem/introducing-smartsteem-s-bid-bot-and-smartmarket ;
https://hive.blog/steem/@therealwolf/guide-how-to-make-88-profit-and-lose-over-1000-usd-while-using-bid-bots ;
https://hive.blog/smartsteem/@smartsteem/manual-curation ;
https://hive.blog/bidbot/@aggroed/dear-bidbots-thoughts-after-the-hardfork
Truth in comedy: people paid to be seen and lost money doing it. Trending was
for sale.

**Self voting.** Upvoting your own post. HF20 (2018) removed the author's
curation advantage; HF21 made it cheap to punish.
Sources: HF20 post; theycallmedan (above)
Truth in comedy: on a chain where a vote is money, voting for yourself is
paying yourself from the shared pot.

**Vote trails.** Following a curator so your vote copies theirs. hive.vote
(formerly SteemAuto): "The trail followers will follow the upvotes of the
leading account."
Source: https://hive.blog/hive-vote/@steemauto/hivevote-free-and-unlimited-automation-service-on-hive
Truth in comedy: much of Hive's curation is automatic. When a big curator
votes, a train follows.

**Flag wars.** Late 2017: @berniesanders downvoted @haejin's many daily posts,
which drew about 1 percent of the reward pool; @ranchorelaxo upvoted them back;
bots joined both sides. @znog's summary: "You don't win this war by destroying
what you hate, you win it by saving what you love".
Source: https://hive.blog/steemit/@znog/steem-wars-berniesanders-vs-haejin
Truth in comedy: two large stakes can fight over one post for months. Everyone
else watches.

**Plagiarism and the cheetah bot.** Since July 2016 @cheetah comments the
likely source under copied posts. It "does NOT flag posts it thinks are
plagiarized". It does not know if you own the source, and says so.
Source: https://hive.blog/steemit/@anyx/cheetah-bot-the-fight-against-spam-and-plagiarism-continues
Truth in comedy: copying was the first abuse on the chain, and the first answer
was a polite bot.

**Spaminator, Hivewatchers, the blacklist.** Steemcleaners became Hivewatchers
at the fork. Spaminator leaves "a tiny dust warning vote". The blacklist appeal
requires a public apology post with a fixed title. Guiltyparties on threats:
"Public outrage and threats have no impact. If they did, we'd be corrupt."
Sources: https://hive.blog/hivewatchers/@guiltyparties/regarding-hivewatchers-and-spaminator ;
https://hive.blog/hivewatchers/@hivewatchers/appealing-the-hivewatchers-blacklist
Truth in comedy: Hive has no moderators, so volunteers with stake became them,
and everyone argues about it.

**Powering down.** Starting the 13-week unstake. On Hive it is read as a
signal: leaving, or cashing out. Dalz's data: "whenever the price of HIVE goes
up, there is more powering down as people want to cash out".
Source: https://hive.blog/hive-167922/@dalz/hive-power-up-and-power-down-or-historical-data-by-day-months-and-top-accounts-4rh2sg
Truth in comedy: it is visible on chain, and ETHOS says it is not wrongdoing.

**The bear market.** Activity follows price. Combined posts and comments were
around 25,000 a day in Sept 2024; PeakD alone did 10,000 a day at the 2022
peak. Dalz: "Everything slows down in a bear market".
Sources: https://hive.blog/hive-133987/@dalz/a-look-at-the-top-hive-frontends-or-sep-2024 ;
https://hive.blog/hive-167922/@dalz/new-hive-accounts-or-total-created-claimed-and-top-creators-or-july-2022 (search summary)
Truth in comedy: the world really does get quieter. README's "chain weather"
candidate is this.

**Blurt.** The chain with no downvote. Named for saying things without
thinking. It also charges a fee for every action and started with a "regent"
account holding a controlling stake. When its promoters mass-tagged a post on
Hive in 2024, a reply said that was exactly why downvotes exist.
Sources: vikisecrets post; Blurt README; blrtannouncement post (all in 3g)
Truth in comedy: remove the downvote and spam has no brake. Blahgart is loud
because nothing can quiet it.

**Splinterlands.** The game that at one point had more players than Hive had
bloggers. Dalz, Nov 2020: "there are now more gamers than bloggers on the Hive
blockchain".
Source: https://hive.blog/hive-167922/@dalz/hive-gaming-or-number-of-active-hive-gaming-accounts
Truth in comedy: for years the chain's busiest users never wrote a post.

**The dev fund debates.** The DHF pays proposals ranked above the return
proposal. In May 2023 the HBD stabilizer, which had absorbed the whole budget,
was scaled back so it would "no longer serve as a substitute for the return
proposal". Since then the arguments are about which line items deserve to sit
above it.
Sources: https://hive.blog/hbd/@smooth/hbd-stabilizer-evolution-may-2023 ; https://hive.blog/@gtg/dhf
Truth in comedy: a fund with no owner is argued over by everyone, in public,
every hour.

**Steemit Inc's ninja mine.** The stake that started it all. Tarazkp: the
early miners "had designed and set up the system to have an unfair advantage".
Source: https://hive.blog/hive-174578/@tarazkp/steem-softforking-exchanges-security-and-mining-ninjas
Truth in comedy: the villain's treasure was real before the villain arrived.

**Justin Sun as folk villain.** He bought the company, promised to give
governance back in "4-6 weeks", called the witnesses "hackers", and his side
later seized 23.6 million STEEM from opponents. Hive's whitepaper calls it a
51 percent attack "committed by the founding company Steemit Inc".
Sources: steemitblog HF22.5 letter; Decrypt (news); whitepaper
Truth in comedy: Emperor J SON is a pun on a real name and a real data format.
The chain's raw data really is JSON.

**The whales.** Both a rank (1,000 million VESTS) and a mood: the few accounts
whose vote moves a payout by hundreds of dollars.
Sources: dhimmel; HiveBuzz thresholds
Truth in comedy: influence is stake, and stake is public.

**Exit scam.** A project that takes money and vanishes. No Hive-specific
primary source was found for the phrase; it is general crypto slang. Basecamp's
own word for the milder version is "extractor" and ETHOS is clear that earning
and leaving is allowed.
Source: `features/basecamp/ETHOS.md`
Truth in comedy: the game's Drainiac and Sly Grin already split this into
"drains slowly" and "snatches and runs".

**Sock puppet.** In 2020, the 20 witnesses installed by exchange votes. Today,
any fake run by a hidden hand.
Sources: pfunk; @hiveio exclusion criteria
Truth in comedy: the same trick that took the old chain is the daily trick
Basecamp's patrol games train people to spot.

**Censorship resistance, no owner, 3-second blocks, free transactions.**
hive.io's own headline claims: "zero fees", blocks "every 3s", owned by
"no one", "governed by everyone".
Source: https://hive.io/
Truth in comedy: all four are literally true and all four have a cost. Free
actions need Resource Credits; no owner means no one to appeal to.

**"The community forked away."** The whitepaper's footnote: the first time a
full migration was used to survive a 51 percent attack.
Source: whitepaper II.5
Truth in comedy: the ruins are the proof. The link out of them is the receipt.

---

## 5. Hive's own games: what kept players, what lost them

**Splinterlands.** Announced and launched as Steem Monsters on 26 May 2018;
battles began 14 Oct 2018; daily quests 26 Oct 2018. Moved to Hive 1 Jun 2020
because, as reported at the time, it could not "operate on a chain where the
changes aren't public" (the quote is from the migration announcement as
summarised in news; the hive.blog post of 29 May 2020 gives the schedule).
Growth in 2021: SPS token airdrop from July, land sold out 9 June, rentals at
"$20,000+ earned daily", 50,000 daily players on 10 Aug 2021, 700,000
Spellbooks by 26 Oct 2021. Decline: transactions fell from 3 to 5 million a day
in 2021 to 2022 to about 100,000 by Nov 2024; battles from 500,000 to 100,000
a day after anti-bot steps in June 2024; new accounts down to 75 a month; SPS
from over 0.50 dollars to about 0.01. Bots were banned from Modern ranked in
July 2023; before that "players were fighting 95% bots at the start of the
season" (player report). What kept people: rentals, guild brawls, a governance
token, land. What lost them: bots crowding humans out, then the bear market,
then the anti-bot cut itself, which made the numbers honest and smaller.
Sources: https://docs.splinterlands.com/company/timeline/history-2018 ;
https://docs.splinterlands.com/company/timeline/history-2020 ;
https://docs.splinterlands.com/company/timeline/history-2021 ;
https://hive.blog/splinterlands/@splinterlands/hive-migration-and-other-updates ;
https://hive.blog/splinterlands/@splinterlands/50000-daily-active-users ;
https://hive.blog/hive-13323/@dalz/splinterlands-stats-or-nov-2024-or-transactions-games-players-and-price ;
https://hive.blog/hive-13323/@kalkulus/splinterlands-bans-bots-from-modern-ranked-and-my-thoughts-on-two-upcoming-proposals ;
https://medium.com/@splinterlands/splinterlands-migrating-to-hive-blockchain-on-6-1-200a0bb4fc0d (search summary)

**dCity.** A city builder by @gerber on Hive Engine, moved from Steem Engine in
April 2020. By 12 June 2020: 93,000 cards, 518 players, 60,000 HIVE and STEEM
paid to top ranks. Nov 2020: about 250 daily players. Oct 2021: SIM had slid
from 0.005 to 0.001 HIVE; "every time HIVE pumps, the tokens on Engine dump";
taxes ate most of a city's output; "people aren't as fun as they used to be".
July 2023: ranking rewards switched from HIVE to SIM; the team said reserves
covered rewards "for at least 10-15 years". What kept people: daily income
and a leaderboard. What lost them: a token that fell against HIVE and a tax
system that punished new players.
Sources: https://hive.blog/gaming/@gerber/dcity-updates-hive-transition-beeswap-on-hive-engine ;
https://hive.blog/dcity/@dalz/dcity-stats-2-or-cards-issued-hive-and-sim-rewards-top-players ;
https://hive.blog/hive-167922/@dalz/hive-gaming-or-number-of-active-hive-gaming-accounts ;
https://hive.blog/hive-102223/@enforcer48/dcity-a-game-that-keeps-on-givin ;
https://hive.blog/dcity/@dcitygame/change-of-ranking-rewards-from-hive-to-sim

**Rising Star.** A music career game since 2020 by @atomcollector (Jux), with
STARBITS and STARPRO on Hive Engine. Play was off chain, so dalz could only
estimate a few hundred players from Discord in 2020. Joined the Blockchain
Gaming Accelerator in June 2021. In mid-2026 (the post showed as three months
old on 5 Sept 2026) the team announced it was "shutting down in it's current
form" and handing over to Blockchain Gaming (@wagginston). Reasons given: the
HBD interest rate dropped from 20 to 12 percent, hosting costs rose, the HIVE
price stagnated, and hacks of Hive Engine bridges took accumulated funds. The
new owners said NFTs would keep working "just the same as before the
transition". What kept people: a low-stress daily loop. What lost it: the
studio's income model, not the players.
Sources: https://hive.blog/@risingstargame/important-announcement-regarding-the-future-of-rising-star ;
https://hive.blog/hive-131619/@wagginston/rising-star-has-joined-the-blockchain-gaming-accelerator ;
https://hive.blog/hive-167922/@dalz/hive-gaming-or-number-of-active-hive-gaming-accounts

**Others seen in the data.** Nov 2020: Crypto Brew Master about 800 daily
(peak 1,500), Rabona 200 plus, Hollybread under 100 and falling, Exode under
10. Dalz's line for the period: more gamers than bloggers, about 10,000
monthly gaming accounts against 3,500 posting accounts.
Source: https://hive.blog/hive-167922/@dalz/hive-gaming-or-number-of-active-hive-gaming-accounts

**The pattern, in one line each.** Players stay for daily loops, rentals and
leaderboards. They leave when bots fill the ladder, when the token they are
paid in falls against HIVE, or when the studio's income model breaks. The
Hive Engine bridge hacks named by Rising Star could not be sourced from a
primary post in this pass; that is open question 9.

---

## 6. Ten things the game invents where the chain already provides

1. **A fixed 21 helmets, one per consensus witness.** The chain has 20
   consensus witnesses and one rotating backup seat (whitepaper III.3). The
   21st helmet could belong to whoever holds the seat this window.
2. **"NEWBS" as a HUD counter** (`hud.newbs`). The chain provides account age;
   the glossary provides "new user". The word is on the avoid list.
3. **Oxygen and spare air as invented fuel.** The chain has Resource Credits:
   a bar that refills 20 percent a day and is spent by every action. Same
   shape, real name.
4. **Three virtues (Power, Wisdom, Courage) as the measure of an account.**
   The chain already has public measures: HP, reputation, and the fish ranks.
   The virtues can stay as colours, but the readouts should be the real ones.
5. **The Emperor's hoard spiralling into his keep.** On Hive the equivalent of
   the ninja stake sits in the DHF, an account with no keys, 69 million HIVE in
   Oct 2021. The keep's card could show that the hoard became a public vault.
6. **Troll holes as the Emperor's supply lines.** The real supply line was one
   account: @dev365, the proxy the exchanges pointed customer votes at.
7. **Mount Socko as pure lore with no page behind it.** The chain has the real
   exclusion criteria and the launch post. A plaque could link to @hiveio's
   exclusion update without naming any account (see open question 4).
8. **The Steem Ruins as a dead district.** Steem trades every day (rank 571,
   2.9 million dollars daily volume on 5 Sept 2026). The ruins are true from
   Hive's side; the museum should say the old chain still runs.
9. **The daily Buzzing Station as an invented rotation.** Hive already has a
   monthly ritual on the 1st (HPUD) and HiveBuzz's daily "Top Upvoted" badge.
   The station could point at those instead of a random landmark.
10. **A White Knight who "returns what was stolen".** The real one tried and
    Bittrex refused. The honest quest is a helper who sometimes fails.

Not counted, because the chain does not provide them and inventing is fine:
gems, the mesh, the ferris wheel ride, Copypasta, the sock trip.

---

## 7. Open questions for the owner

1. Should the 21st helmet become the "wandering helmet" that tracks the live
   backup seat, or stay fixed for simplicity?
2. Should the museum say plainly that Steem still runs, and link the current
   Steem price, or is the Ruins metaphor allowed to stand alone?
3. Should the White Knight quest include the failure (Bittrex kept the coins),
   or is a clean rescue better for the game?
4. May the museum name the 20 excluded puppet witness accounts and the five
   Steemit Inc accounts, since they are on chain and in @hiveio's posts, or
   does the "never flag real accounts" rule cover historical names too?
5. Should oxygen be renamed or tooltipped as Resource Credits, so the fuel
   teaches the real mechanic?
6. Should the HUD's NEWBS label change to the glossary word, and what should it
   count?
7. Is the name "Buzzing Station" meant to echo HiveBuzz, and should HiveBuzz be
   asked before badge-shaped achievements are built?
8. Should the fish ranks (redfish to whale) appear on a player's own card as a
   readout, given the rule that no readout renders a verdict?
9. Can you point to the primary posts about the Hive Engine bridge hacks that
   Rising Star's closing post blames, so section 5 can cite them?
10. Should dCity join the arcade list, or is it no longer alive enough?
11. Is a rusted "vote vending machine" in the Ruins (the bid-bot era) too
    inside a joke for new users, or exactly the kind of truth in comedy wanted?
12. Should the HPUD festival use HiveBuzz's 100 HIVE Power-bee threshold or
    traciyork's 10 HIVE prize threshold as its "you took part" line?

---

## 8. Sources

Fetched and read in full unless marked "(search summary only)", which means the
page was seen only through a search engine's excerpt. News sources are marked
"(news)" and used only for the takeover timeline.

Hive's own documents

- https://hive.io/ (homepage claims: zero fees, 3s blocks, no owner, 158 apps, 248 communities, 10 HiveFests, 15 percent HBD)
- https://hive.io/whitepaper.pdf (dated 28 Sept 2020; fork account, assets, RC, inflation split, DHF, witnesses, 7-day window, 50/50)
- https://hive.blog/faq.html (reputation, power down, delegation, HBD, RC, curation, downvotes, witnesses, savings)
- https://developers.hive.io/tutorials-recipes/understanding-configuration-values.html (block interval, 21 witnesses, 17 required, 30 votes, 7-day cashout, 13 intervals, 5-day mana, 10 HBD proposal fee)
- https://developers.hive.io/tutorials-recipes/rc-bandwidth-system.html (RC as a manabar, HF20)
- https://hive.io/en/about/ (could not be fetched; every attempt returned the homepage)

The fork, participant posts

- https://hive.blog/communityfork/@hiveio/announcing-the-launch-of-hive-blockchain
- https://hive.blog/hiveblockchain/@hiveio/community-discussion-updates-hive-airdrop-exclusion-core-developer-meetings
- https://hive.blog/hiveblockchain/@hiveio/hive-secondary-airdrop-no-additional-airdrops
- https://hive.blog/steem/@softfork222/soft-fork-222
- https://hive.blog/hive-111111/@therealwolf/steem-protective-soft-fork-v0-22-2
- https://hive.blog/tron/@steemitblog/an-open-letter-to-the-community-hf22-5
- https://hive.blog/steem/@pfunk/the-exchanges-used-by-justin-sun-to-attack-steem-part-1-boycott
- https://hive.blog/steem/@lukestokes/how-steem-became-hive
- https://hive.blog/neoxian/@neoxian/the-list-of-accounts-that-are-being-excluded-from-hive
- https://hive.blog/hive-174578/@tarazkp/steem-softforking-exchanges-security-and-mining-ninjas
- https://hive.blog/steem/@penguinpablo/steem-hardfork-seizes-over-22-million-steem-power
- https://hive.blog/steem/@apshamilton/justin-sun-thwarted-a-white-knight-saves-the-steem-stolen-by-hf0-23-by-sending-to-bittrex
- https://hive.blog/wiki/@propolis.eng/hive-hard-fork (2022 retelling; dates loose)
- https://hive.blog/steemit/@steemitblog/steemit-inc-and-tron-foundation-partnership (could not be fetched on hive.blog, peakd, ecency or steemit.com)

The fork, news (timeline only)

- https://finance.yahoo.com/news/justin-sun-bought-steemit-steem-230126090.html (CoinDesk, 25 Feb 2020)
- https://www.coindesk.com/tech/2020/03/03/steem-community-mobilizes-popular-vote-in-battle-with-justin-sun/ (search summary only; page rate-limited)
- https://www.coindesk.com/tech/2020/04/05/steem-witnesses-freeze-32m-in-latest-tit-for-tat-with-hard-fork-insurgents (search summary only)
- https://decrypt.co/38050/steem-steemit-tron-justin-sun-cryptocurrency-war (long timeline, quotes)
- https://decrypt.co/29626/a-daring-plan-to-save-5-million-of-cryptocurrency-steem-failed
- https://cointelegraph.com/news/justin-sun-accused-of-bribing-his-way-to-the-top-of-the-steem-hierarchy
- https://cointelegraph.com/news/steem-community-resists-takeover-hard-fork-launches-hive-network (search summary only; the 20 puppet names)
- https://unchainedcrypto.com/steemit-chaos-why-justin-sun-and-the-community-are-at-war/ (search summary only; the 6 Mar town hall)
- https://en.wikipedia.org/wiki/Steemit (founding dates only)
- https://www.steem.center/index.php?title=Steemit (search summary only; 24 Mar 2016, 4 Jul 2016)
- https://coinmarketcap.com/currencies/steem/ (Steem still trades, 5 Sept 2026)

Hardforks

- https://hive.blog/steem/@steemitblog/steem-velocity-hardfork-hardfork-20
- https://hive.blog/steem/@steemitblog/hf21-sps-and-eip-explained
- https://hive.blog/@hiveio/has-the-eclipse-happened-explaining-how-hive-hardforks-work-and-activating-hf24-on-october-14th
- https://hive.blog/hive/@hiveio/hive-hardfork-25-is-on-the-way-hive-to-reach-equilibrium-on-june-30th-2021
- https://hive.blog/hive/@hiveio/the-evolution-of-hive-hardfork-26
- https://steemit.com/steemit/@steemitblog/hf19-equality-coming-soon-linear-rewards (search summary only)
- https://steemit.com/steem/@steemitblog/hf20-update-hardfork-successful (search summary only)

DHF and HBD

- https://hive.blog/@gtg/dhf
- https://hive.blog/hbd/@smooth/hbd-stabilizer-evolution-may-2023
- https://hive.blog/hive-160391/@gtg/gtg-witness-update-upcoming-changes-in-hbd-apr
- https://hive.blog/hive-167922/@phortun/the-potential-of-the-hbd-savings-interest-rate-raised-to-20 (search summary only)

Communities

- https://hive.blog/steemit/@steemitblog/communities-have-arrived

Ranks, badges, rituals

- https://hive.blog/steem/@dhimmel/steem-vest-ranks-plankton-minnow-dolphin-orca-whale
- https://steemit.com/redfish/@albertvhons/steemit-introduce-the-new-level-redfish (search summary only)
- https://hive.blog/hivebuzz/@hivebuzz/hivebuzz-hive-gamification-experience
- https://docs.hivebuzz.me/ (introduction page only; badge sub-pages did not load)
- https://hive.blog/hivebuzz/@hivebuzz/pud
- https://hive.blog/@hivebuzz/pud-helper
- https://hive.blog/hivebuzz/@hivebuzz/pum
- https://hive.blog/hive-167922/@traciyork/welcome-to-hivepud-hive-power-up-day-july-1st-2021
- https://hivefe.st/ (HiveFest XI, Barcelona, 17 to 20 Sept 2026)
- https://hivefe.st/2022/index.html (search summary only)
- https://steemfest.com/ and https://steemfest.com/2017/ (search summary only; 2016 to 2019 editions)

Patrol

- https://hive.blog/steemit/@anyx/cheetah-bot-the-fight-against-spam-and-plagiarism-continues
- https://hive.blog/hivewatchers/@hivewatchers/appealing-the-hivewatchers-blacklist
- https://hive.blog/hivewatchers/@guiltyparties/regarding-hivewatchers-and-spaminator
- https://hive.blog/hive/@hivewatchers/the-hivewatchers-and-spaminator-operational-proposal-for-the-period-2022-2024
- https://hive.blog/ai/@hivewatchers/ai-generated-content-not-original-content
- https://hive.blog/anti-abuse/@arcange/dualpost-blacklist-identifying-steem-milkers-on-hive

Jokes and truisms

- https://hive.blog/curation/@lexiconical/exposing-advertiser-circle-jerks-in-trending-reward-pool-rape-and-bookingteam-com
- https://hive.blog/downvote/@theycallmedan/free-downvotes-are-comming
- https://hive.blog/steem/@smartsteem/introducing-smartsteem-s-bid-bot-and-smartmarket
- https://hive.blog/steem/@therealwolf/guide-how-to-make-88-profit-and-lose-over-1000-usd-while-using-bid-bots
- https://hive.blog/smartsteem/@smartsteem/manual-curation
- https://hive.blog/bidbot/@aggroed/dear-bidbots-thoughts-after-the-hardfork
- https://hive.blog/steemit/@znog/steem-wars-berniesanders-vs-haejin
- https://hive.blog/hive-vote/@steemauto/hivevote-free-and-unlimited-automation-service-on-hive
- https://hive.blog/hive-167922/@dalz/hive-power-up-and-power-down-or-historical-data-by-day-months-and-top-accounts-4rh2sg
- https://hive.blog/hive-133987/@dalz/a-look-at-the-top-hive-frontends-or-sep-2024

Blurt

- https://hive.blog/steem/@vikisecrets/new-steem-fork-is-coming-blurt-is-this-another-justin-sun-controlled-chain-who-is-behind-the-regent-account
- https://raw.githubusercontent.com/Blurt-Blockchain/blurt/dev/README.md
- https://hive.blog/blurt/@blrtannouncement/blockchain-without-downvotes-at-your-fingertips

Games

- https://docs.splinterlands.com/company/timeline/history-2018
- https://docs.splinterlands.com/company/timeline/history-2020
- https://docs.splinterlands.com/company/timeline/history-2021
- https://hive.blog/splinterlands/@splinterlands/hive-migration-and-other-updates
- https://hive.blog/splinterlands/@splinterlands/50000-daily-active-users
- https://hive.blog/hive-13323/@dalz/splinterlands-stats-or-nov-2024-or-transactions-games-players-and-price
- https://hive.blog/hive-13323/@kalkulus/splinterlands-bans-bots-from-modern-ranked-and-my-thoughts-on-two-upcoming-proposals
- https://medium.com/@splinterlands/splinterlands-migrating-to-hive-blockchain-on-6-1-200a0bb4fc0d (search summary only)
- https://hive.blog/hive-167922/@dalz/hive-gaming-or-number-of-active-hive-gaming-accounts
- https://hive.blog/gaming/@gerber/dcity-updates-hive-transition-beeswap-on-hive-engine
- https://hive.blog/dcity/@dalz/dcity-stats-2-or-cards-issued-hive-and-sim-rewards-top-players
- https://hive.blog/hive-102223/@enforcer48/dcity-a-game-that-keeps-on-givin
- https://hive.blog/dcity/@dcitygame/change-of-ranking-rewards-from-hive-to-sim
- https://hive.blog/@risingstargame/important-announcement-regarding-the-future-of-rising-star
- https://hive.blog/hive-131619/@wagginston/rising-star-has-joined-the-blockchain-gaming-accelerator
- https://hive-engine.com/ (title only)

In the repo

- apps/blog/features/hive-frontend-universe/README.md
- apps/blog/features/hive-frontend-universe/HANDOFF.md (lore section; AI paraphrase, not quotation)
- apps/blog/features/hive-frontend-universe/lib/fixed-world.ts (landmarks, dApp and arcade lists, Steem Ruins link)
- apps/blog/features/hive-frontend-universe/engine/hazards.ts, coins.ts, helmets.ts, combat.ts, gems.ts
- apps/blog/features/basecamp/ETHOS.md
- apps/blog/features/basecamp/CONTEXT.md
- apps/blog/locales/en/common_blog.json (`hive_frontend_universe.*` strings, including `hud.newbs`)
