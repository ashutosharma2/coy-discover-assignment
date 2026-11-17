# ADR-002: Swipes are final

- Status: Accepted
- Date: 2026-11-17
- Written: 2026-11-17

## Scenario

The brief says a profile that has been swiped on must never appear again. On a phone, a drag release and a button tap, or a double tap, can send the same swipe twice in a fraction of a second.

## Obstacle

If a swipe could change, like-then-pass would let a user find out and then take it back: like Ananya, see `matched: true`, then pass. In a two-sided app it leaks the other way too, because Ananya would see a match appear and then vanish.

Rejecting every repeat isn't right either. A double tap would show an error for a swipe that worked.

## Action

The first swipe on a profile is final:

- **The same swipe again** (a double tap) gets the original answer back with HTTP 200, and nothing new is stored.
- **A different swipe** gets HTTP 409 with `{ "success": false, "message": "A different swipe has already been recorded." }`. The body is identical whether or not the other person liked the user.

The check for an existing swipe, the insert and any match write run in one `BEGIN IMMEDIATE` transaction, with the `(from_id, to_id)` primary key as the backstop ([ADR-003](003-sqlite-with-node-sqlite.md)).

Coy's own website gives the same rule for crushes ("Adding is final") so that nobody can add and remove names to test who likes them (getcoy.com, read 2026-11-17).

Alternatives considered:

- **Let a swipe change.** It opens the like-then-pass probe above.
- **Reject every repeat, including the same swipe.** A double tap would show an error after a swipe that went through.
- **Last write wins.** The same probe, and a match could disappear.

## Result

- Tests: a repeated like and a repeated pass return the original answer and store one row each. A changed swipe returns the 409 for likers and non-likers alike, and the match count doesn't change.
- With the conflict check deliberately replaced by an update, two tests failed, so the tests catch a regression.
- Pass-then-like is rejected too. It leaks nothing a plain like wouldn't, because a match it made would be mutual, so privacy isn't the reason to reject it. Open: write down the reason for rejecting it.

## Troubleshooting

- None.
