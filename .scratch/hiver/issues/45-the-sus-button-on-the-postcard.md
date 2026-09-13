# The SUS button on the postcard

Type: task
Status: resolved
Blocked by: none

## Question

Bryan, 2026-09-12, pointing at a circle drawn on a screenshot beside the
username and above the post: "im pointing out that space as available space.
without changing or moving anything else. we can use that space. I want a
button there in that space that says SUS. make the button red and SUS bold.
when you hit that button. i want another card to pop up. it should say, bot,
sock, extractor, scammer, spammer, other (with option to write a comment
here) below should these should be an optional space to write a comment
asking. 'what seemed off about this post/account' this info submitted has the
pottential to enter into other games or feed future data. maybe it will be
sent to an organization that helps protect hive."

## Answer

Built 2026-09-12. Not committed.

**The button.** Red, bold, capitals, in exactly the circled space: the end of
the name row, which was empty. Nothing else moved — it is `shrink-0` at the
end of a row whose middle column already stretched to fill that gap, so the
rings, the name, the post and every drawing keep the positions they had, and
the card's height cap is untouched. Outlined red when nothing has been
reported, solid red once it has. It carries the same popover every other
thing on the card has.

**The card that pops up.** Six choices in his order — bot, sock, extractor,
scammer, spammer, other — as chips. Every one that fits can be ticked, not
just one: a sock is often a spammer too. Ticking `other` opens a one-line box
for what it is instead. Under them, the optional comment, asked in his own
words: "What seemed off about this post/account?". Send is dead until at
least one chip is ticked. Reopening a reported post shows what was said, and
offers "Take it back".

**Where the report goes: nowhere, yet, and it says so.** The card's last line
reads "Kept on this device for now, and nothing is posted to Hive. Later it
may feed the Patrol games, or go to a group that protects Hive." There is no
service to send these to and nothing was invented to pretend there is. The
shape that would be sent is fixed now (`lib/sus.ts`): account, permlink,
every reason ticked, the words for `other`, the comment, and the time. A
later send has a record to read rather than a blank start.

This is the only thing on the postcard that is not a reading of the chain.
That is deliberate and it is not a breach of "visual indicators, not
conclusions" (ETHOS.md): the card still refuses to conclude anything — this
is the reader concluding, which is what a curator is (CONTEXT.md), and it is
patrol in its smallest form.

## Files

- `apps/blog/features/basecamp/lib/sus.ts` — new. The reasons, the report
  shape, and save/read/remove in this browser's storage. No expiry: a report
  is the reader's own record.
- `apps/blog/features/basecamp/postcard/sus-button.tsx` — new. The red
  button and its two states.
- `apps/blog/features/basecamp/postcard/sus-dialog.tsx` — new. The card that
  pops up.
- `apps/blog/features/basecamp/postcard/identity-strip.tsx` — takes the
  post's permlink now, and holds the button at the end of the name row.
- `apps/blog/features/basecamp/newcomers-list-item.tsx` — passes the permlink.
- `apps/blog/locales/*/common_blog.json` (nine) — `basecamp.card.sus`,
  translated in all nine, not left in English.

## Checked

Types clean, lint clean on all five files, no locale key missing in any of
the nine. In the browser: the button sits in the circled space on every card
and nothing else moved; the pop-up opens; two chips tick; the `other` box
appears; Send writes the report; the button goes solid; reopening shows what
was said and offers to take it back. Test report cleared afterwards.

## Still open

- Nothing is sent anywhere. When there is somewhere to send it, this needs a
  decision about whether reports are signed by the reporter, and whether a
  report is ever visible to the person reported.
- A reader can report the same post once. There is no rate limit and no way
  to tell a careful reporter from a careless one — whatever receives these
  later will have to weigh them.
