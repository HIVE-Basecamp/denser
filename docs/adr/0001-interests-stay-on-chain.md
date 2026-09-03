# Interests stay on chain

New users and guides put their interests on public record as a Hive `custom_json`, not in a
database of ours. That is the whole reason a different Hive frontend can match against them: any
app can read a named account's record with nobody hosting a service, nobody agreeing on an
endpoint, and nobody having to be trusted — an off-chain store could reach the same result only by
adding a permanent service that every participating frontend then depends on, and a browser-only
store could not reach it at all. Kept as a `custom_json` record rather than a field on the account
profile, because other frontends rewrite that profile field wholesale and would erase the
interests the next time somebody edited their bio elsewhere.

## Consequences

Reads are per-account only. The chain answers "what did this named account declare", never "who
declared photography", so matching walks a candidate list and real interest search would need a
separate index — on-chain or off, that index has to be built either way.

Moving off chain later is not a migration we could perform. Records are signed by their owners, so
every user would have to re-declare their own interests.
