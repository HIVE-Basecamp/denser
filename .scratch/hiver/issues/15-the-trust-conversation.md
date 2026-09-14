# The trust conversation

Type: grilling
Status: resolved
Blocked by: none

## Question

What may the game, or the postcard, say about a real person's account?

Three levels: (1) show facts only; (2) facts plus the player's own private note; (3) the game itself says "bot" or "real".

Facts to bring: `lib/observations.ts` holds local real/bot/unsure judgements, unwired; the red-ring question from the Sep 2 archive (Q32, Q35); the patrol games judge live accounts; Bryan on Sep 2: "openly judging in some of these games, kind of with a wink, thus still fun. Truth and comedy." The lore keeps enemies fiction, never built from blacklist data. Until this resolves, only levels 1 and 2 get built.

## Answer

Bryan, 2026-09-14. Grilled in four questions. The whole ticket turned on a
distinction the written rule had lost.

### The line is the chain, not the building

`HANDOFF.md` carried a HARD RULE: "Do not build verify UI or trust logic, or
any feature that flags real accounts, until the trust-model conversation
happens." Bryan on what he actually meant: "I think I was probably just
saying let's not build anything that is labeling a user on chain, and somehow
that just got conflated to the whole building or creating of Basecamp and
HIVER altogether."

So:

- **Off the chain: no gate at all.** Judgement tools are the work. "We are
  trying to find visual clues and give information for users to come to their
  own judgment on a post whether it's legit... we have to make judgments.
  We're trying to find tools to make judgments."
- **On the chain: gated, but by deployment, not by building.** "Anything that
  we're building in the game currently is not going on chain... before we
  deploy it, we will make these decisions... but we need the freedom to build
  as needed as we're iterating."
- **A player's own vote or reply was never gated.** "When I'm using the tool
  or in Basecamp, I'm putting my a vote or I'm making a comment, but that's
  me. I don't need you to block that."

The rule in `HANDOFF.md` has been rewritten to say this, with the date on it.

### The three levels

All three may be built now, because none of them reaches the chain yet.

1. Facts only — already built.
2. Facts plus the curator's own private note — the SUS button, and
   `lib/observations.ts`. Built, local.
3. The tool itself saying it — allowed to be built and iterated on, and it is
   the intended destination, not a line never to cross.

Bryan's correction of two things said back to him, both about tense:

- On the SUS button "never leaving your machine": "more accurate would be, it
  doesn't **currently** leave my machine."
- On the badges being the gated part: "more accurate would be to say, would
  **eventually** be on chain. but we need to build it freely as currently
  everything is just here local."

### Q3 — does a negative label ever go on chain? Yes

"Absolutely, it's intended to be on chain. The ultimate goal is we are trying
to give people on chain clues of who this account that they are dealing
with."

- Sources are both: our own tools, games and hoops, **and** findings accepted
  from other onboarding or policing projects and blacklists we trust. "We
  trust that information. We will put labels."
- A **positive** badge exists too, and came up unprompted: POH, proof of
  human. Earned by going through hoops. It means a curator "can feel okay
  about upvoting without having to read their post".
- **There will be a way to appeal.** "Though by the time they have this badge,
  it should be clear they are malicious to the chain."
- The scale behind it: "let's say eight out of ten new users are garbage...
  then we need to identify those people. And once we're sure, put the label on
  them."

### Q4 — does the person see it? Two tiers

- **Internal, not published today.** What a curator ticks and writes in the
  SUS card, and what the games record. "We don't need some users comment of why
  they think the account is sus to be shown publicly on chain."
- **Published, everyone sees.** "If a certain amount of things become clear
  and are true, we will give negative labels that everyone will see on chain."

What turns the first into the second is undefined. "We are still in the
process of defining what that means."

## Settled

- Build freely off chain. No trust gate on building, on judging, or on
  storing a judgement locally.
- Nothing the tool decides about a person goes on chain before Bryan says we
  are ready to deploy.
- **Currently** a curator's reasons stay internal, and a label the project
  becomes sure of is the thing meant to be public. Bryan, the same day, on
  this very line: "a curator's reasons stay internal should not be a hard
  rule. It is, once again, CURRENTLY a curator's reasons stay internal. But if
  there is some reason why we want to publish on chain what a curator says, as
  long as they're aware that it's gonna get published, this is not a rule. It
  might very well happen." 
- Negative labels on chain are intended, from our own tools and from trusted
  outside sources, with an appeal path.

## Carried on to ticket 46

The whole on-chain half: what earns a badge, what threshold turns internal
signals into a public label, how appeal works, and the conflict with
`ETHOS.md` ("the tool does not decide for them").
