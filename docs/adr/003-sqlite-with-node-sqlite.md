# ADR-003: SQLite through Node's built-in `node:sqlite`, with one swipe per pair enforced by the database

- Status: Accepted
- Date: 2026-11-17
- Written: 2026-11-17

## Scenario

Profiles, swipes and matches have to survive a page reload and a server restart. There's no live demo: reviewers clone the public repo and run it themselves.

## Obstacle

- Two requests for the same pair can arrive together (see [ADR-002](002-swipes-are-final.md)). That must never store two swipes or two matches.
- Reviewers shouldn't have to install and start a database server.
- A native npm package may need a compiler, or a prebuilt binary for the reviewer's Node version.

## Action

- A SQLite file at `data/coy.db` (gitignored), created and seeded on the first request. `npm run reset` deletes it, and the next request seeds a fresh one, even while the server is running ([store.ts](../../src/lib/server/store.ts)).
- Node's built-in `node:sqlite` module, so there's nothing to install.
- `swipes` has `PRIMARY KEY (from_id, to_id)`. `matches` stores the two ids in sorted order with `CHECK (user_a < user_b)`, so a pair has one row whichever way round it's written ([database.ts](../../src/lib/server/database.ts)).
- `recordSwipe` starts with `BEGIN IMMEDIATE`, which takes SQLite's write lock before the "has this pair been swiped?" check, so no other writer can get between the check and the insert. `busy_timeout` is 5 s.

`node:sqlite` runs synchronously. Inside one Node process, two requests can't interleave inside `recordSwipe` anyway. The lock and the keys protect the data when more than one process writes, or if the code becomes async later.

Facts checked on nodejs.org (sqlite.html and deprecations.html, Node 26.13.1 docs, read 2026-11-17):

- `node:sqlite` was added in v22.5.0. It has needed no flag since v22.13.0 and v23.4.0, and it became a release candidate in v25.7.0.
- The class was renamed from `DatabaseSync` to `Database`. `DatabaseSync` is kept as a documentation-only deprecated alias (DEP0210), which gives no runtime warning.
- Node 26.10.0, the version this was built and tested on, has only `DatabaseSync`. That's the name that works on every version from 22.13 on, so the code uses it.

Alternatives considered:

- **PostgreSQL.** It also has transactions and unique constraints, but every reviewer would need a database server running. It would only pay off with a hosted demo, because serverless hosts don't keep a SQLite file between requests.
- **A JSON file.** No constraints and no transactions. Two async writes can overwrite each other.
- **better-sqlite3.** A native module, so a reviewer's install may need a compiler or a matching prebuilt binary.

## Result

- Tests: the database refuses a second swipe for a pair even when the code is bypassed (`UNIQUE constraint failed`). Swipes and matches survive a simulated restart, and a deleted file is re-seeded with new ids.
- On 2026-11-17, against the dev server: after a real restart the feed still had 26 profiles and the match was still there. After `npm run reset`, with the server still running, the next request seeded a fresh database: 30 profiles and no matches.
- Only tested on Node 26.10.0. `package.json` asks for Node 22.13.0 or newer, based on the docs, not on a test run (BACKLOG.md).

## Troubleshooting

- **Build warning: "Dynamic filesystem access causes tracing of the whole project."** `next build` flagged `existsSync(file)` in store.ts because the path comes from an environment variable. That would make a deployment bundle include the whole project. The database is created at runtime, so there's nothing to trace. Fix: Next's opt-out comment, `/*turbopackIgnore: true*/`, on the two filesystem calls. The rebuild showed no warnings.
