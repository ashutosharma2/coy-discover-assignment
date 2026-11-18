# ADR-012: An owl works in one room behind the deck

- Status: Accepted. Replaces [ADR-011](011-pigeon-behind-the-deck.md)
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The pigeon scene was two drawings on an empty background: a desk cut off by the tab bar and a chart floating on its own. I wanted one small room instead. A tiny owl sorts postcards at a wooden desk, checks a constellation board on the wall, and every so often two paths line up.

## Obstacle

- Preset poses moved every part at the same moment and repeated in a fixed order, so the character looked like it was looping.
- A wing turned to a fixed angle slides off the postcard as soon as the body leans.
- Rive would suit a character like this, but its [free plan exports with a splash screen](https://rive.app/docs/account-admin/pricing.md), and the assignment has to cost ₹0.
- The match screen opened the moment the server answered, so it covered anything the room did for a match.
- Nobody may find out who liked them until a like is mutual ([ADR-001](001-server-decides-matches.md)). An owl with more reactions has more ways to give that away.
- The app has no access to Coy's brand assets, so the owl can't be a copy of Coy's own mascot.

## Action

- **The owl is an original drawing:** a heart-shaped face, round brass glasses, a red scarf and small hearts on its chest. All the art is inline SVG in [OwlArt.tsx](../../src/components/scene/OwlArt.tsx), [DeskArt.tsx](../../src/components/scene/DeskArt.tsx), [BoardArt.tsx](../../src/components/scene/BoardArt.tsx) and [RoomArt.tsx](../../src/components/scene/RoomArt.tsx).
- **No new dependency.** [owl-rig.ts](../../src/lib/client/owl-rig.ts) gives every joint its own spring. The eyes are the fastest and the body the slowest, so one movement travels through the bird.
- **The wings solve for their target.** Two-bone inverse kinematics works out the elbow, so a wing tip stays on the postcard wherever the body has leaned.
- **The routine is built as it runs.** [mascot.ts](../../src/lib/client/mascot.ts) picks the next stretch of work at random with varied timing: five ways of examining a postcard, a sip of chai, a stretch, and a look at the stars every few cards.
- **React doesn't redraw while the owl works.** [owl-puppet.ts](../../src/components/scene/owl-puppet.ts) writes SVG transforms once per frame, and it stops when Discover isn't showing.
- **The scene still hears only the user's own results.** It never receives a profile.

| Moment | What the owl does |
|---|---|
| Discover opens | Looks up, straightens its glasses and starts work |
| Any swipe is saving | Holds a postcard and studies the board, the same for every swipe |
| Pass saved | Puts the postcard in the tray |
| Like saved, no match | Sends the postcard to the board, where it is pinned and a star lights |
| Swipe not saved | Puts the postcard back on the pile and shakes its head |
| Match confirmed by the server | Two postcards meet, the two halves on the board join into a heart, and the owl celebrates |

- **The match screen now waits 2.1 seconds** after a confirmed match so the room can play it. Input stays locked during that time. The wait is skipped with reduced motion on, and on screens where the board is hidden.
- On phones and tablets the desk becomes a shelf along the top of the card. Phones from 640 to 719 px tall show only the owl's head above the card. Below that the card keeps all the space.

Alternatives considered:

- **Rive.** It has the best tools for this, but the free export adds a splash screen.
- **Lottie.** Its animations play back as recorded, so a wing can't reach for a postcard that has moved.
- **GSAP.** It sequences animation well, but the springs and the wing solver would still have to be written by hand.
- **Canvas.** It would redraw the whole picture every frame and lose the sharp, styleable SVG parts.
- **Keeping the CSS poses from ADR-011.** Simpler, but it caused the looping look this decision is meant to fix.

## Result

- Real swipes on 2026-11-18 played each reaction above. A pass on someone who had liked the user left the board unchanged, and the heart appeared only for a like the server confirmed as a match.
- With the save delayed by 1.8 seconds, the owl kept waiting until the answer arrived. With the save blocked, the card came back and the owl returned its postcard.
- Tests check that no routine or other reaction can align the stars, across 20 random seeds of 60 stretches each.
- A short drag still sprang back, and a long drag and the arrow keys still swiped.
- Checked at 320 × 568, 375 × 667, 390 × 844, 412 × 915, 768 × 1024, 1024 × 768, 1280 × 720, 1440 × 900 and 1920 × 1080 with no sideways scrolling and nothing overlapping the card.
- In desktop Chrome at phone size the scene held 60 frames a second, including with the processor slowed four times. The slowest frame took 33 ms.
- With reduced motion on, the owl stays still, nothing animates, and a like still pins its postcard.
- Not tested: a real phone, or how much battery the animation uses.

## Troubleshooting

- **The board showed a heart before any match.** The two halves were only moved apart, so they still read as a heart. Fix: turn each half away from the other until a match brings them together.
- **A liked postcard flew to the top-left corner of the screen.** Its landing spot used `display: none`, which gives an element no position. Fix: hide it with `visibility: hidden`.
- **The letter flap and the spark jumped away from where they belonged.** SVG parts scale from the corner of the drawing by default. Fix: set `transform-box: fill-box` so each one scales around itself.
