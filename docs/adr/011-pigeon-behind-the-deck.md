# ADR-011: A pigeon sorts postcards behind the deck

- Status: Superseded by [ADR-012](012-owl-in-one-room.md)
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The plain navy background left the Discover screen feeling empty. I wanted it to tell a small story: a character behind the scenes sorts postcards, studies a star chart and looks for the right connection.

## Obstacle

- The character reacts to swipes, and Coy's core promise is that nobody finds out who liked them until a like is mutual ([ADR-001](001-server-decides-matches.md)). One hopeful glance at the wrong moment would break that promise.
- On a phone the card fills almost the whole screen, so a background behind it would barely be seen.
- It has to run all the time without slowing the swipe or getting in the way of a drag.
- The app has no access to Coy's brand assets, so the character can't be presented as Coy's own mascot.

## Action

- **The character is an original carrier pigeon** with a postal cap, a nod to love letters carried by pigeons in old Hindi film songs. It is drawn as inline SVG in [DeskArt.tsx](../../src/components/scene/DeskArt.tsx), next to a star chart in [ChartArt.tsx](../../src/components/scene/ChartArt.tsx).
- **No new dependency.** [director.ts](../../src/components/scene/director.ts) changes one `data-pose` attribute on a timer, and CSS moves the parts. React doesn't redraw while the pigeon works.
- **The routine has pauses.** The pigeon sorts three postcards, then stops to study the stars and join two of them ([mascot.ts](../../src/lib/client/mascot.ts)).
- **The scene only hears the user's own results.** It receives whether a swipe is saving and, once saved, the action and the server's `matched` answer. It never receives a profile.

| Moment | What the pigeon does |
|---|---|
| Any swipe is saving | Studies the chart, the same for every swipe |
| Pass saved | Puts the postcard aside |
| Like saved, no match | Pins the postcard to the chart and lights a star |
| Match confirmed by the server | The stars form a heart and the pigeon celebrates |

- On phones and tablets the card moves down to make a strip for the desk and chart, and the strip disappears on short screens. On wide screens the desk and chart stand either side of the card.
- The scene ignores touches and clicks. With reduced motion turned on, the pigeon stays still and the stars still light up.

Alternatives considered:

- **Rive or Lottie.** They suit richer animation but add a dependency and a separate art file, and a few poses don't need that.
- **Motion for every pose.** It is already installed, but the poses would then depend on JavaScript for every frame. CSS transitions do the same job here.
- **A faint pattern behind the card.** Simpler, but it doesn't tell the story and would barely show on a phone.

## Result

- With the server slowed down on 2026-11-18, the pigeon stayed in the `wait` pose until the answer arrived for a pass on a non-liker, a pass on a liker, a like on a non-liker and a like that made a match. Both passes then played the same actions.
- Tests check that only a confirmed match can show the heart, and that a swipe the server didn't confirm doesn't count.
- A slow short drag still sprang back and a long drag still swiped. The console was empty.
- Checked at 320, 375, 768, 1280 and 1680 px wide with no sideways scrolling. At 320 × 568 the strip is hidden and the card keeps the space.
- Not tested: a real phone, or how much battery the idle animation uses.

## Troubleshooting

- **The chart and lamp slid under the card at 1280 px.** Their widths ignored the card's width. Fix: size both from the space left beside the card.
- **The lamp's glow had a hard edge.** The gradient was off-centre and cut off by its own shape. Fix: centre the gradient and let the drawing overflow its box.
