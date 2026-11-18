# ADR-009: Lorelei avatars, generated once and committed

- Status: Accepted
- Date: 2026-11-18
- Written: 2026-11-18

## Scenario

Every seeded profile needs a photo, and the brief allows placeholders. These are dating profiles with made-up names.

## Obstacle

- Photos of real people would put real faces on fictional dating profiles.
- Loading images from another website makes the app depend on that site staying up.
- Avatar styles carry different licences, and some require credit.

## Action

- Each profile gets an illustrated avatar from DiceBear's `lorelei` style, drawn by [generate-avatars.mjs](../../scripts/generate-avatars.mjs) and committed to `public/avatars/`.
- DiceBear is a dev dependency only. The running app serves plain SVG files and never generates or downloads an avatar.
- Lorelei's default skin colour is white, so the script sets a range of warm brown skin tones and dark hair colours to suit the Indian names in the seed.
- Avatars aren't sensitive, so `public/` is the right place for them. The seed data, by contrast, stays on the server ([ADR-004](004-nextjs-route-handlers-server-only.md)).

Licence, read from the package's own LICENSE file on 2026-11-18: the Lorelei artwork by Lisa Wischofsky is CC0 1.0, and the code is MIT.

Alternatives considered:

- **Other DiceBear styles.** `adventurer`, `personas` and `micah` list CC-BY-4.0, which requires credit.
- **Stock or generated photos of people.** Real or realistic faces on fictional dating profiles.
- **Our own SVG drawing script.** More code, for a less finished result.

## Result

- 30 SVG files, 244 KB in total. A test checks that every seeded profile has one.
- Avatars loaded from the production build on 2026-11-18.
- `@dicebear/lorelei` 9.4.2 needs `@dicebear/core` 9, not the newer 10.x, so both are pinned to 9.4.2.

## Troubleshooting

- **`import { lorelei }` failed:** "does not provide an export named 'lorelei'". The package exports `create`, `meta` and `schema` directly. Fix: `import * as lorelei`.
- **Next.js warned that avatars should load eagerly.** A card's image starts as the card underneath and later becomes the main image on screen. Fix: `loading="eager"` on every avatar.
