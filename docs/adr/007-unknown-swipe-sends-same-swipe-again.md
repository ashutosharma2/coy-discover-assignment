# ADR-007: An unknown swipe is settled by sending the same swipe again

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The card flies off as soon as the user lets go, while `POST /api/swipe` is still on its way. The animation takes a fraction of a second, but the server's answer can be slow or never arrive.

## Obstacle

When a request fails, the browser often can't tell what happened. If the connection drops after the server commits, the swipe is saved even though the browser saw an error. Treating that as "not saved" would be wrong, and so would assuming it was saved. If the saved like made a match, the user might never see it.

## Action

- **Sending the same swipe again settles it.** The `(from_id, to_id)` key already makes a repeat safe ([ADR-002](002-swipes-are-final.md)): if the first attempt was saved, the server returns its original answer, including `matched: true`. No separate idempotency key is needed.
- [swipe-flow.ts](../../src/lib/client/swipe-flow.ts) retries only when there's no usable answer: a network failure, a timeout (8 s per attempt) or a 5xx. It makes up to 3 attempts: at once, after 0.5 s, then after a further 1.5 s.
- If all 3 attempts fail, the card comes back with "Not saved. Check your connection and swipe again."
- **A 409** means an earlier swipe on this profile was saved, so the first swipe stands. The browser fetches the feed and matches again, shows the match if there is one, and says "Your first swipe on Kabir stands."
- **A 404** means the database was reset while the page was open, so the browser fetches the feed again.
- While a swipe is unconfirmed, the next card is visible but locked. "Saving your swipe…" appears only if the answer takes longer than 400 ms.
- "It's a match!" appears only after the server says so and the card has finished leaving.

Alternatives considered:

- **An idempotency key per swipe.** The pair of ids already does that job.
- **Bringing the card back on the first failure.** The user would see an error for a swipe that may have been saved.
- **Waiting for the server before animating.** Every swipe would feel as slow as the network.

## Result

- Tests cover how each response is read, the retry count and delays, and that the card stays in the deck until the swipe is confirmed. With the retry removed, 2 tests failed.
- Browser checks on 2026-11-18, with the network faked:
  - Network down: 3 attempts, 510 ms and 1,502 ms apart, then the card came back with the message.
  - First reply lost on a like that made a match: the retry got the original answer and the match screen appeared.
  - Every reply lost, then a pass on the returned card: the server answered 409, the match screen appeared and the first swipe stood.
  - The database held one swipe per profile afterwards.
- A user can land on a match with someone they just swiped left on, because the earlier like was saved. That follows from swipes being final.

## Troubleshooting

- **The first error message wrapped onto two lines** on a 375 px screen and pushed the card up. Fix: a shorter message.
