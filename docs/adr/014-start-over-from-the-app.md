# ADR-014: Start over from inside the app

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

After swiping through all 30 profiles, the app had nothing left to show. The only way to replay it was to stop, run `npm run reset` in a terminal and reload. A reviewer trying the demo shouldn't need a terminal for that.

## Obstacle

- Swipes are final ([ADR-002](002-swipes-are-final.md)), so a reset must not become a way to undo one swipe.
- Replaying with the same likers would tell the user who liked them before they swipe ([ADR-001](001-server-decides-matches.md)).
- A reset erases matches, so one stray tap shouldn't be able to do it.
- It is the only request that erases data, and any website can send a POST to a local server.

## Action

- **The button appears only when the deck is empty,** on the "Every postcard read" card ([DeckEnd.tsx](../../src/components/DeckEnd.tsx)). There is no way to reset halfway through and retry one person.
- **It asks first.** "Start over?" explains what will be cleared, and "Keep my matches" is the button that receives focus.
- **`POST /api/reset` works in one transaction** ([seed.ts](../../src/lib/server/seed.ts)): it deletes every swipe and match, then picks 8 new likers at random. Profiles keep their ids.
- **The answer says nothing about likers.** The response is only `{ "success": true }`.
- **Requests from other sites get a 403,** using the browser's `Sec-Fetch-Site` header.
- **The browser changes only after the server confirms.** The room also takes down its pinned postcards, lit stars and heart.

Alternatives considered:

- **Deleting the database file, as `npm run reset` does.** It also changes every profile id, and it closes the connection while other requests may be using it.
- **Clearing only the user's own swipes.** Simpler, but the same people would have liked the user on every replay.

## Result

- Tests check that swipes and matches are cleared, profiles stay, new likers are picked, a match can still happen, and a cross-site request erases nothing.
- In the browser on 2026-11-18, all 30 profiles came back, Matches emptied, and the pinned postcard and lit star left the board. A double click sent one request. A blocked reset kept the matches and showed an error.
- Not tested: a real phone.
