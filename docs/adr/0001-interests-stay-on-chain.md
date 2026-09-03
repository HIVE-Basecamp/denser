# Interests stay on chain

When someone puts their interests on record, we save that to the Hive
blockchain — not to a database of our own, and not in their browser.

The reason is matching across different sites. Anything on the chain can be read
by any Hive app: no server to run, no address to agree on, nobody who has to be
trusted. If we kept interests in a database of ours, another site could only
match against them if somebody ran that database forever and every site agreed
to depend on it. If we kept them in the browser, no other site could ever see
them at all, and a person would lose their own interests just by switching
phones.

We save them as their own record rather than writing them into the account
profile, where avatars and bios live. Other Hive sites rewrite that profile
wholesale whenever someone edits their bio, which would quietly wipe the
interests out.

## Consequences

**You can only ask about one named person at a time.** The chain answers "what
did this account declare"; it cannot answer "who likes photography". So matching
works through a list of candidates, and real search would need a separate index
built alongside — which would be true wherever the interests lived.

**Moving off the chain later is not something we could do for people.** Every
record is signed by the person it belongs to, so each one of them would have to
put their interests on record again themselves.
