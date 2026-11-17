# ADR-001: The server decides matches, and nothing it sends reveals an incoming like

- Status: Accepted
- Date: 2026-11-17
- Written: 2026-11-17

## Scenario

Coy's core promise, from the assignment brief: never reveal who has liked the user unless it's mutual. The Discover tab still has to show one card at a time and say "It's a match!" the moment a like is mutual.

## Obstacle

Anything the server sends to the browser can be read in the DevTools Network tab, so hiding a field in the UI isn't privacy. Leaks can also be indirect:

- the order or make-up of the feed;
- a response that looks different for a pass on someone who liked you;
- an error message or status code that depends on the other person;
- an endpoint that returns raw swipes;
- a request that lets you act as someone else.

## Action

- Likes live in a `swipes` table that only the server reads.
- The server decides the match. On a like, it looks for the reverse like in the same transaction and writes the match row ([discover.ts](../../src/lib/server/discover.ts)).
- Every profile leaves the server through one allowlist function, `toPublicProfile`, which builds the eight public fields. Database rows are never passed through as they are.
- The feed query only reads the user's own swipes (`from_id = user`). It never touches anyone's likes of the user.
- `POST /api/swipe` takes only `profileId` and `action`. The brief has no auth, so the server fixes who the user is (`ME_ID = "me"`). A `fromId` in the body is ignored.
- No response depends on the other person's like. A pass always returns `{ "matched": false }`. A like returns `matched`, which is only true when the like is mutual, and that's the moment the brief says to reveal it. The 400, 404 and 409 bodies are fixed strings.
- There are three API routes and none of them returns swipes.
- A match is stamped with the time of the user's like that completed it, never the other person's earlier like time.

Alternatives considered:

- **A `likedYou` flag that the UI hides.** It's readable in the Network tab.
- **Deciding the match in the browser.** The browser would need to know who liked you first.
- **Sending database rows as they are.** A column added later would leak without anyone noticing.

## Result

- Tests check the exact key set of every feed and matches item, that a pass on a liker and a pass on a non-liker get byte-identical HTTP responses, that the 409 is identical for both, and that a `fromId` in the body is ignored ([tests/](../../tests/)).
- On 2026-11-17, curl against the dev server returned `{"matched":false}` with HTTP 200 for a pass on a liker and for a pass on a non-liker.
- A pass returns before the reverse-like lookup runs, so its timing doesn't depend on the other person either.
- Not built, because the brief excludes auth: sign-in, per-user sessions and rate limiting. A real deployment would need all three.

## Troubleshooting

- None.
