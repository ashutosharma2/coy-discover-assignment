# Coy Discover: the project story (SOART)

SOART is Scenario, Obstacles, Actions, Results and Troubleshooting. This file tells how Coy Discover was built, from a take-home brief to a swipe deck that keeps one privacy promise. Each decision has its own record in [adr/](adr/).

**Status (2026-11-18):** Part B is built, tested and pushed. Part A, my own walkthrough of the Coy app, is still in progress, and the app hasn't been tried on a real phone.

---

## S: Scenario

On 2026-11-17 I received the take-home for the Coy SDE intern role. Part A asks me to use the Coy app and suggest two core features. Part B asks for a standalone, mobile-first app: a tab bar with a blank Home tab and a Discover tab, a swipe deck of at least 30 seeded profiles, a match only when both sides have liked each other, a Matches view, three API endpoints, and swipes that survive a reload.

One line in the brief mattered more than the rest: never reveal who has liked the user unless it's mutual.

The constraints: Next.js preferred, one logged-in user and no external auth, no access to Coy's code, and none of Coy's logo or brand assets. It had to cost ₹0. I was a beginner in React, Next.js and Node, and I have to be able to defend every decision in an interview.

## O: Obstacles

1. **The browser can't keep a secret.** Anything sent to it can be read in the Network tab, so hiding a "liked you" field in the interface protects nothing.
2. **A like can leak indirectly.** The feed's order, an id, a different response for a pass, an error message or a guessable endpoint could each give it away, even with no such field in the response.
3. **The repo is public.** Anyone can read the seed file on GitHub, so it can't say who liked whom.
4. **A swipe runs on two clocks.** The card leaves in a fraction of a second, but the server's answer can be slow or never arrive. A lost reply doesn't say whether the swipe was saved.
5. **Reviewers run it themselves.** There's no live demo, so cloning the repo and starting the app had to be enough.
6. **A character that reacts to swipes can leak too.** One hopeful glance from the mascot at the wrong moment would break the same promise the API keeps.

## A: Actions

### The privacy rules, before any code (2026-11-17)

I started by listing how a user could work out an incoming like: feed position, repeated swipes, response differences, timing, guessed endpoints and a changed user id. Those became the design. The server decides every match, one allowlist function builds what leaves the server, and the browser sends only a profile id and an action ([ADR-001](adr/001-server-decides-matches.md)).

### Swipes are final (2026-11-17)

If a swipe could change, someone could like a person, see the match and take it back. So the first swipe stands. A double tap gets the original answer, and a different swipe gets a 409 with the same body for everyone ([ADR-002](adr/002-swipes-are-final.md)).

### The backend (2026-11-17)

I first leaned towards Postgres, then chose SQLite: there's no live demo, and reviewers shouldn't need a database server. It uses Node's built-in `node:sqlite`, with one row per pair enforced by the primary key and each swipe written in one `BEGIN IMMEDIATE` transaction ([ADR-003](adr/003-sqlite-with-node-sqlite.md)). Next.js route handlers serve the API, and `server-only` makes the build fail if browser code imports the database ([ADR-004](adr/004-nextjs-route-handlers-server-only.md)).

Profiles get random UUIDs, 8 of the 30 are picked as likers when the database is seeded, and the feed is shuffled on every request ([ADR-005](adr/005-random-ids-likers-at-seed-time-shuffled-feed.md)).

### The Discover UI (2026-11-18)

The brief asks for two tabs, so Matches sits inside Discover. The deck lives above the tabs and is fetched once per page load, because a refetch would reshuffle it on every tab switch ([ADR-006](adr/006-two-tabs-deck-above-them.md)).

When a reply is lost, the browser sends the same swipe again. The pair of ids already makes a repeat safe, so no separate idempotency key is needed ([ADR-007](adr/007-unknown-swipe-sends-same-swipe-again.md)). Motion handles the drag ([ADR-008](adr/008-motion-for-the-drag.md)).

### Portraits drawn in code (2026-11-18)

DiceBear avatars worked but looked alike ([ADR-009](adr/009-lorelei-avatars-generated-once.md)). I wanted stamp-style portraits that show who each person is, so all 30 are now drawn as original vector art from code, each with props from that person's bio ([ADR-010](adr/010-portraits-drawn-in-code.md)).

### From a pigeon to an owl's room (2026-11-18)

The plain blue background felt empty. The first attempt was a pigeon sorting postcards ([ADR-011](adr/011-pigeon-behind-the-deck.md)), but it looked like two drawings on an empty page. It became one room: an owl at a sorting desk, a constellation board on the wall and a red thread between them. Each joint has its own spring, so a movement travels from the eyes to the body, and the wings work out how to reach each postcard ([ADR-012](adr/012-owl-in-one-room.md)).

I looked at Rive for the character, but its free export adds a splash screen and the paid plan breaks the ₹0 rule. The scene is inline SVG with no new dependency, and it never receives a profile.

### A foreground that feels like a dating app (2026-11-18)

The card became a large perforated stamp with the name on the portrait. Three cards are stacked, Like and Pass are equal-sized pills, and filters work on fields already shown on each card. The room now follows the device's clock, with a button to override it ([ADR-013](adr/013-postcard-deck-and-clock-theme.md)).

### Auditing my own design (2026-11-18)

I measured the finished screen instead of judging it by eye. That found real problems: keyboard focus vanished after a swipe, the card collapsed at high zoom, details were hidden on short phones, and the end of the deck felt unfinished. All four were fixed, along with bigger portraits on phones, lighter shading and a better Matches view.

### Start over (2026-11-18)

After I'd swiped through all 30 profiles, the only way to replay the app was a terminal command. Now the last card offers **Start over**. It asks first, clears swipes and matches in one transaction, and picks new likers so an earlier run doesn't give away the answers ([ADR-014](adr/014-start-over-from-the-app.md)).

## R: Results

- **The promise holds where it can be tested.** A pass on someone who liked the user and a pass on anyone else get byte-identical responses, and a changed swipe gets the same 409 for both. Across 20 random seeds of 60 stretches of work each, the owl's routine never showed the heart.
- **One swipe per pair, even when the code is bypassed.** The database refuses a second row. After a real server restart, the swipes and the match were still there.
- **A lost reply doesn't lose a match.** With the first reply dropped on a like that made a match, the retry got the original answer and the match screen opened. With the network down, the card came back after 3 attempts.
- **Tests.** 104 Vitest tests: 19 on the swipe rules, 19 on the routes and 66 on the browser logic. Seven deliberate bugs, including no shuffle and likers sorted first, each made tests fail before I restored the code.
- **Screens.** Checked at 13 sizes up to 1920 × 1080, including a phone on its side, with no sideways scrolling. Every control can still be reached at 200% text size and 400% zoom.
- **Speed, in emulation.** On an emulated slow phone and connection, the first visit downloads 493 KB and the largest element appears after 3.3 s, with almost no layout shift (0.001). Dragging held 60 frames a second with the processor slowed four times.
- **Security check.** `npm audit` found 0 vulnerabilities on 2026-11-18.
- **Cost.** ₹0.
- **What this doesn't show.** A real phone or touchscreen, battery use, Node 22 or 24, more than one real user, or how the app would behave once deployed.

## T: Troubleshooting

### Setup and tooling

- **My personal email was on the first commits (2026-11-17).** Both commits carried my personal email address before the repo went public. I set the repo to my GitHub noreply address and rewrote both commits before the first push. Lesson: check the commit identity before anything becomes public.
- **Next.js could have frozen the feed (2026-11-17).** `create-next-app` 16.4.6 turned on Cache Components, which can prerender a GET handler at build time. I removed it, and the build now lists every API route as dynamic. Lesson: read what a starter template turns on.
- **`tsc` couldn't find `LayoutProps` (2026-11-17).** Next.js generates those types into `.next/types`, which a fresh clone doesn't have. `npm run typecheck` now runs `next typegen` first. Lesson: test commands the way a fresh clone would run them.
- **The build warned about tracing the whole project (2026-11-17).** `existsSync(file)` used a path from an environment variable, so the bundler couldn't tell what it needed. The `/*turbopackIgnore: true*/` comment on the two filesystem calls removed the warning.
- **The docs and my Node disagreed (2026-11-17).** Node's latest docs rename `DatabaseSync` to `Database`, but Node 26.10.0 only has `DatabaseSync`. The old name works on every supported version, so the code keeps it. Lesson: check the version that's installed.
- **The avatar import failed (2026-11-18).** `import { lorelei }` gave "does not provide an export named 'lorelei'", because the package exports its parts directly. `import * as lorelei` fixed it.
- **The first render had no styling (2026-11-18).** The dev server kept serving the old `globals.css` after the file was replaced. Restarting it fixed the page. Lesson: rule out a stale server before debugging the code.
- **Port 3000 was already in use (2026-11-18).** My own dev server was running with my demo data. I tested on a separate production build on port 3100 with its own database. Lesson: keep test data away from the data you're using.
- **A hidden browser window stalled a long test (2026-11-18).** The run stopped making progress while its window was hidden, most likely because browsers slow down hidden pages. Rerunning it in a separate automated browser gave 30 profiles, 30 requests and 30 database rows.
- **`next build` failed on a test file (2026-11-18).** After I replaced the mascot's types, the build stopped with a type error in `tests/client.test.ts`. The Next.js build type-checks the test files too. Updating the tests fixed it.
- **The linter rejected a memoised callback (2026-11-18).** React Compiler's `preserve-manual-memoization` rule failed because the swipe callback depended on a value derived from a list built on every render. `useMemo` on the filtered list fixed it.
- **`npm run dev` failed with ENOENT (2026-11-18).** I ran it from my home folder, which has no `package.json`, and an older dev server was still running. Stopping that server and running the command inside the project fixed it. Lesson: instructions should say which folder to start in.

### Layout

- **A faint bar appeared above the tabs in Matches (2026-11-18).** The rotated postmarks overflowed the album sideways and produced a scrollbar. `overflow: clip auto` fixed it.
- **The error message wrapped onto two lines (2026-11-18).** On a 375 px screen it pushed the card up. A shorter message fixed it.
- **The chart and lamp slid under the card at 1280 px (2026-11-18).** Their widths ignored the card's width. Sizing them from the space beside the card fixed it.
- **The filter button covered the heading (2026-11-18).** The heading was too wide for the card's column. I made it smaller and later moved Filters into the top bar.
- **The filter sheet stuck to the top of the screen (2026-11-18).** A centred dialog needs a height to centre. `height: fit-content` fixed it.
- **The card drifted away from the owl's shelf on tall tablets (2026-11-18).** The column was centred while the shelf stayed fixed. Aligning the column to the top below 960 px fixed it.
- **A sideways phone showed only the top of the portrait (2026-11-18).** The stamp was too wide and short. The portrait now sits beside the details, with Like and Pass beside the card.
- **The portrait shrank on the smallest phone (2026-11-18).** A rule meant for sideways phones also matched a 288 px card, because it was based on the card's height. Basing it on the screen's height fixed it. Lesson: a layout rule should test the condition it's really about.
- **A cut-off bio showed the top of the next line (2026-11-18).** Line clamping doesn't hide text inside padding. A transparent border now makes that space.
- **Match cards lined up unevenly (2026-11-18).** A taller card stretched its row, and a button centres its content vertically. Laying the card out as a column from the top fixed it.
- **The red thread showed below the shelf (2026-11-18).** On phones the card normally hides the thread's curve, so it appeared once the deck was empty. The thread is now clipped at the shelf.

### The room and animation

- **The lamp's glow had a hard edge (2026-11-18).** The gradient was off-centre and cut off by its own shape. Centring it and letting the drawing overflow fixed it.
- **The board showed a heart before any match (2026-11-18).** The two halves were only moved apart, so they still read as a heart. Each half is now turned away until a match brings them together. Lesson: check what a design implies, as well as what the code does.
- **A liked postcard flew to the top-left corner (2026-11-18).** Its landing spot used `display: none`, which gives an element no position. `visibility: hidden` keeps the position.
- **The letter flap and the spark jumped out of place (2026-11-18).** SVG parts scale from the corner of the drawing by default. `transform-box: fill-box` makes each one scale around itself.
- **The first portraits came to 1,909 KB (2026-11-18).** Coordinates were stored too precisely, and curves had more points than the display needs. Rounding them brought the total to 1,176 KB with no visible change at card size.

### Accessibility

- **Keyboard users could reach controls behind the match screen (2026-11-18).** The page behind it stayed focusable. `inert` on the main content and the tab bar fixed it.
- **Pressing Like with the keyboard lost my place (2026-11-18).** The button became disabled during the save, so the browser moved focus to the page. `aria-disabled` keeps the focus, and presses are ignored while a swipe saves.
- **The card collapsed at 400% zoom (2026-11-18).** It shrank to 67 px tall and couldn't scroll, and every font size was fixed in pixels. Sizes now use `rem` and `em`, and short screens scroll.
- **Large text broke the top bar (2026-11-18).** At 200% the segments overflowed and the name ran into the info button. The bar and the name now wrap.
- **High-contrast mode lost the button shapes (2026-11-18).** Windows' forced colours remove backgrounds, and the bio's transparent border turned into black bars. Real outlines and a border colour for that mode fixed both.

### Checks that misled me

- **The cards vanished from my night screenshots (2026-11-18).** The page looked broken with a faked clock, but on the real clock the card was fully visible. The fixed time most likely stopped the entrance animation. Lesson: confirm a bug without the test's own tricks before fixing it.
- **Every bio looked cut off (2026-11-18).** My first check flagged all 30, because the handwriting font's strokes overflow their line. Measuring each bio with and without the line limit showed 0 of 30 cut at 390 × 844. Lesson: a measurement that fails everything is probably measuring the wrong thing.
