# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

Single-context repo, but the domain docs do not sit at the repo root. They live with the feature they describe:

- **`apps/blog/features/basecamp/ETHOS.md`**: read first. What Basecamp is for and the commitments behind it.
- **`apps/blog/features/basecamp/CONTEXT.md`**: the glossary. The agreed words, and the ones agreed not to use.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

H.I.V.E.R. (the Hive Frontend Universe game) has its own notes in `apps/blog/features/hive-frontend-universe/`: `README.md` (architecture and invariants), `ART-DIRECTION.md` (visual rules), `HANDOFF.md` (human context). Read them before working on the game.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (interests stay on chain), but worth reopening because…_
