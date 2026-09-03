# Interests stay on chain

Interests on record are saved to the Hive blockchain, so any Hive app can read
them and match against them: a database of ours would work only if somebody ran
it forever and every site agreed to depend on it, and browser storage no other
site could read at all. They are their own record rather than a field on the
account profile, because other sites rewrite that profile wholesale when
somebody edits their bio and would wipe the interests out.

## Consequences

The chain answers "what did this account declare", never "who likes
photography", so matching works through a list of candidates. Moving off chain
later would mean every person re-declaring their own interests, since each
record is signed by its owner.
