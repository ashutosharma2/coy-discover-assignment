# ADR-010: Portraits drawn in code

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

The lorelei avatars from [ADR-009](009-lorelei-avatars-generated-once.md) worked, but they all looked alike and said nothing about the person. I wanted richer stamp-style portraits, where each one shows who the person is and what they like. I had a reference sheet of illustrated portraits for the style.

## Obstacle

- The reference sheet couldn't be used directly. Each portrait has about 232 × 180 px of art, and the card's stamp needs roughly 560 × 700 px on a phone. Enlarged to that size, a tile was visibly soft. The tiles are also wide while the stamp is tall.
- Many faces on the sheet looked like the same person, and its hobbies didn't line up with the seeded profiles.
- The art goes in a public repo, so its source has to be clear.

## Action

The sheet is a style reference only, and no part of it is copied. Each portrait is drawn by code in [scripts/avatars/](../../scripts/avatars/):

- `ink.mjs` has the tapered brush lines and inked shapes that give the hand-drawn look.
- `face.mjs`, `hair.mjs` and `outfit.mjs` build each person from choices such as skin tone, face shape, hair and clothes.
- `props.mjs` and `scenes.mjs` draw the hobby and background: Karthik's swimming goggles, Riddhi's paintbrush, Aditya's chai robot, the Charminar behind Arjun.
- `people.mjs` lists all 30, following each seeded profile's bio and interests.

`npm run avatars` writes the SVG files to `public/avatars/`, and they are committed. File names didn't change, so the seed and the app needed no edits. DiceBear is gone from the dev dependencies.

Alternatives considered:

- **Slicing the reference sheet.** Too small, the wrong shape, and its source would need settling.
- **30 separately painted portraits.** They could look richer, but the art would have to come from somewhere else, with a source and licence to record.
- **Keeping lorelei.** It needs no work, but the faces stay generic.

## Result

- 30 different portraits, 1,176 KB in total, about 39 KB each. Being vector art, they stay sharp at any size.
- A test checks that every seeded profile has a portrait and that no portrait loads anything from another site.
- In a browser on 2026-11-18, the portraits loaded on the card, the match screen and the Matches album at 375 px, with no console messages.
- These are flat vector drawings, so they have less painted detail than the reference sheet.

## Troubleshooting

- **The first render came to 1,909 KB.** Coordinates were stored to a tenth of a pixel, and curves used more points than the display size needs. Rounding to whole units and sampling fewer points brought it down to 1,176 KB with no visible change at card size.
