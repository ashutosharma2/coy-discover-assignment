# ADR-008: Motion for the drag

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The brief asks for drag gestures on mobile, buttons on desktop, and smooth card animations with clear feedback on each swipe.

## Obstacle

A swipe card has to follow the finger, tilt as it moves, work out how fast it was released, spring back or fly off, and do all of that without slowing the page. A swipe is also final ([ADR-002](002-swipes-are-final.md)), so a small accidental drag must not count.

## Action

- [Motion](https://motion.dev) 14.14.0 (MIT licence) handles the drag, the release speed and the animations in [SwipeCard.tsx](../../src/components/SwipeCard.tsx).
- The drag position is a Motion value, not React state. It changes on every pointer move, and keeping it in state would redraw the deck each time.
- A drag counts as a swipe past 30% of the card's width, or on a flick faster than 500 px/s that has moved at least 24 px. Anything else springs back ([deck.ts](../../src/lib/client/deck.ts)).
- A LIKE or PASS postmark fades in with the drag. The Like and Pass buttons show the same postmark before the card leaves. The left and right arrow keys also work.
- For people who have turned animations off, the postmark appears and the card fades without moving.

Alternatives considered:

- **Pointer Events written by hand.** Nothing to install, but the following, release speed and spring physics would all be custom code.

## Result

- Tests cover the swipe threshold, including a short drag, a tiny fast twitch and a flick back towards the middle. With the threshold lowered to 1%, 3 tests failed.
- In a browser on 2026-11-18, a short mouse drag sprang back and a long one recorded the like. With reduced motion emulated, the card didn't move and the postmark showed.
- Dragging was tested with a mouse, not on a real touchscreen (BACKLOG.md).
- Open: write down the reason for choosing Motion over hand-written Pointer Events.

## Troubleshooting

- None.
