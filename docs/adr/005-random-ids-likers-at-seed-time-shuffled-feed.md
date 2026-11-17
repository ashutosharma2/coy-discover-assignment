# ADR-005: Random ids, likers picked at seed time, and a feed shuffled on every request

- Status: Accepted
- Date: 2026-11-17
- Written: 2026-11-17

## Scenario

The brief asks for at least 30 seeded profiles, some of which have already liked the user so a demo can produce matches. The repo is public, so anyone can read the seed file on GitHub.

## Obstacle

- If the seed inserted the likers first and the feed returned rows in stored order, the first cards would all be people who liked you.
- Even with a shuffled feed, every card carries an id for `POST /api/swipe`. Ids counting up from 1 in seed order would show who liked you.
- Likers written into the seed file would be readable on GitHub.

## Action

- [seed-profiles.ts](../../src/lib/server/seed-profiles.ts) holds only public details: 30 fictional people with Indian names, cities and colleges. It says nothing about likes.
- Seeding gives each profile a random UUID (`crypto.randomUUID`) and picks 8 of them at random as likers ([seed.ts](../../src/lib/server/seed.ts)). Those likes exist only in the database. The seed log prints the count, not who.
- `GET /api/feed` shuffles with Fisher–Yates on every request ([random.ts](../../src/lib/random.ts)). The common `sort(() => Math.random() - 0.5)` isn't used because it doesn't make every order equally likely.
- The shuffle takes its random source as an argument, so tests can use a seeded generator and get the same results every run.

Alternatives considered:

- **Likers fixed in the seed file.** Readable on GitHub, and the same profiles would like you in every run.
- **`ORDER BY RANDOM()` in SQL.** Also fine, but a test can't seed it.
- **Integer ids.** They'd reveal the seed order.

## Result

- Tests:
  - Over 2,000 seeded feeds, the likers' average position is within 0.5 of the middle.
  - Two feeds in a row come back in different orders.
  - Over 60,000 shuffles of three items, each of the six orders comes up within 5% of a sixth.
  - Ids are version 4 UUIDs.
  - Different seeds pick different likers.
- With the shuffle removed, 1 test failed. With likers sorted first, 2 failed.
- Trade-off: a reviewer doesn't know which profiles will match. With 8 likers among 30, liking 5 profiles at random gives at least one match about 82% of the time (1 − C(22,5)/C(30,5); calculated, not measured).

## Troubleshooting

- None.
