# ADR-006: Two tabs, with the deck held above them

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The brief asks for a tab bar with a blank Home tab and a Discover tab, with the functionality built in Discover. It also asks for a Matches view. Moving between tabs shouldn't lose the user's place in the deck.

## Obstacle

- A third Matches tab would go beyond the two tabs the brief describes.
- `GET /api/feed` shuffles on every request ([ADR-005](005-random-ids-likers-at-seed-time-shuffled-feed.md)). Fetching each time Discover opens would put a different card on top after every tab switch.
- React state disappears when the component holding it is removed from the page.

## Action

- Two top-level tabs: Home, which stays blank, and Discover. Inside Discover, a `Discover | Matches` control switches between the deck and the Matches view.
- The feed is fetched once per page load and held in `useDiscover`, which [AppShell](../../src/components/AppShell.tsx) calls above the tabs.
- The top card is always `profiles[0]`, with no separate "current profile" state that could disagree with the list. A card leaves the list only after the server confirms the swipe.
- Panels are hidden, not removed, so a card in the middle of a swipe survives a tab switch.
- Matches are fetched each time the Matches view opens. Seeded profiles never swipe after seeding, so matches can only change through the user's own swipes, and polling would add nothing.
- The app opens on Discover.

Alternatives considered:

- **A third Matches tab.** It goes beyond what the brief describes.
- **A separate route for each tab.** Leaving a route removes its state, so the deck would have to be fetched again and would reshuffle.

## Result

- In a browser check on 2026-11-18, going to Home and back kept the same top card and sent no feed requests.
- After a reload, none of the swiped profiles came back and the matches were still listed.
- Checked at 320, 375, 768 and 1280 px wide and in phone landscape, with no sideways scrolling at 375 px.

## Troubleshooting

- **The first render had no styling.** The dev server kept serving the old `globals.css` after the file was replaced. `--ink` was empty in the browser while the file on disk was correct. Restarting the dev server fixed it.
- **A faint bar appeared above the tabs in Matches.** The rotated postmarks overflowed the album sideways and produced a horizontal scrollbar. Fix: `overflow: clip auto` on the scrolling area.
