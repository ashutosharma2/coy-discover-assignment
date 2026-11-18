# ADR-013: A portrait-led deck, filters on the card's fields, and a room that follows the clock

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The owl's room had become the best part of the screen, and the card in front of it looked like a prototype: a plain panel, a small portrait and two rectangular buttons. I wanted the foreground to work like a modern dating app and still look like a postcard. I also wanted the room to be bright in the daytime and dark at night.

## Obstacle

- The portrait had to become the main element on phones, where the owl's shelf already takes space above the card.
- Filters change which card is on top, and the deck's rules assume one swipe at a time.
- Filters and counts must not reveal who has liked the user ([ADR-001](001-server-decides-matches.md)).
- A theme chosen after the page loads would flash the night room on a daytime visit.
- The room's art has fixed colours, so day and night couldn't be only a change of variables.

## Action

- **The portrait is now a large perforated stamp** with the name and age on it. City, campus, a handwritten bio and coloured interests sit below. Short cards drop the interests first, then move the portrait beside the details on a phone held sideways.
- **Three cards are stacked.** The active card tilts according to where it is held, shows a LIKE or PASS postmark while dragged, and leaves in the direction it was thrown.
- **Like and Pass are equal-sized pills** with round icons. A burst of hearts plays when the server confirms a like, whether or not it is a match. Arrow keys still work, and a held key doesn't repeat.
- **Filters run in the browser** ([filters.ts](../../src/lib/client/filters.ts)) over location, campus and interests. These fields are already on every card, so the API doesn't change. The filter button is disabled while a swipe is saving.
- **The theme follows the device's clock** ([theme.ts](../../src/lib/client/theme.ts)): day from 6:00 am until 6:30 pm, night otherwise. A small script sets it before the first paint, a timer changes it on time, and it is checked again when the page regains focus.
- **A round control** switches between following the clock, always day and always night. The choice is kept in the browser.
- **Fraunces, Manrope and Caveat** replace the earlier fonts, loaded through `next/font` at no cost.
- **A full postcard** opens from each card and from Matches ([PostcardSheet.tsx](../../src/components/PostcardSheet.tsx)). A small card can then shorten its bio without hiding anything for good.
- **Like and Pass stay focusable while a swipe saves.** They use `aria-disabled` instead of `disabled`, because a disabled button loses keyboard focus.
- **Text sizes and breakpoints use `rem` and `em`,** so the layout follows the browser's text-size setting. On very short screens the page scrolls, so nothing is out of reach.
- **Matches shows a count of new matches.** It only counts matches the server has confirmed.

Alternatives considered:

- **Filtering on the server.** It would need a change to `GET /feed` for data the browser already has.
- **Sunrise and sunset times.** More accurate, but they need the user's location, which this app has no reason to ask for.
- **Following the system's dark mode.** It wouldn't change with the time of day on many devices, and that was the point of the request.

## Result

- Real swipes on 2026-11-18 confirmed the stack, the postmarks, the heart burst and a match.
- With the save delayed, repeated clicks and arrow keys sent one request. With the save blocked, the card came back with a message.
- A pass on someone who had liked the user showed nothing different.
- With the clock set to 6:29:40 pm, the theme changed to night at 6:30 pm without a reload.
- Tests cover the filters, the clock boundaries, the time until the next change and the new-match count.
- Checked in day and night at sizes from 320 × 568 to 1920 × 1080, including a phone on its side, with no sideways scrolling and no overlaps.
- Keyboard focus stayed on Like or Pass through a swipe and came back to Like after the match screen closed. Three quick presses during a slow save sent one request.
- The name kept at least 5:1 contrast on all 30 portraits with the lighter shading.
- At 200% text size and 400% zoom, every control could still be reached.
- Not tested: a real phone or touchscreen, or battery use.

## Troubleshooting

- **The filter button covered the end of the heading.** The heading was too wide for the card's column. Fix: reduce its size and show only the icon on phones.
- **On tall tablets the card drifted away from the owl's shelf.** The column was centred while the shelf stayed fixed. Fix: align the column to the top below 960 px.
- **Sideways phones showed only the top of the portrait.** The stamp was too wide and short. Fix: place the portrait beside the details, with Like and Pass beside the card.
- **Pressing Like with the keyboard lost the user's place.** The button became disabled during the save, and the browser moved focus to the page. Fix: use `aria-disabled` and ignore presses while saving.
- **A clamped bio showed the top of the next line.** The clamp doesn't hide text inside padding. Fix: use a transparent border for that space.
