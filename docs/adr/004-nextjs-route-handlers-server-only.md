# ADR-004: Next.js route handlers, with the database code marked server-only

- Status: Accepted
- Date: 2026-11-17
- Written: 2026-11-17

## Scenario

The brief prefers Next.js, with the backend in either Next.js API routes or Express. The database holds who liked whom, which must never reach the browser ([ADR-001](001-server-decides-matches.md)).

## Obstacle

- In Next.js, server and browser code live in one project. A `"use client"` component ships to the browser along with everything it imports, and anything in `public/` can be downloaded by anyone. One wrong import months from now could put the database code in the JavaScript bundle.
- `create-next-app` 16.4.6 turned on Cache Components by default. With it on, Next.js prerenders a GET route handler at build time unless the handler touches request data or uncached data (Next.js route handler docs, bundled with 16.4.6). `node:sqlite` reads are synchronous, and it wasn't clear Next.js would treat them as uncached data. The risk was a feed frozen into the build.

## Action

- Next.js 16.4.6 with the App Router. One project, one `npm run dev`.
- The API lives at `/api/feed`, `/api/swipe` and `/api/matches`, the Next.js convention, which keeps the API apart from the pages. They are the brief's `GET /feed`, `POST /swipe` and `GET /matches`.
- Added on 2026-11-19: a rewrite in [next.config.ts](../../next.config.ts) also answers at the brief's exact paths, `/feed`, `/swipe` and `/matches`. A rewrite keeps a POST's method and body, so both forms reach the same handler.
- Every module that touches the database or the seed lives in `src/lib/server/` and starts with `import "server-only"`. If a client component imports one, even through another file, the build fails.
- The seed data is never in `public/`.
- Cache Components and partial prefetching are removed from `next.config.ts`. Every API response also sends `Cache-Control: no-store`.
- Vitest maps `server-only` to its empty module, because the tests call the server modules directly.

Alternatives considered:

- **React with Express.** Two programs and a proxy in development, and the brief prefers Next.js.
- **Keeping Cache Components and calling `connection()` in each GET handler.** It works, but every future GET handler would have to remember to do it.

## Result

- `next build` lists `/api/feed`, `/api/matches` and `/api/swipe` as dynamic (`ƒ`), rendered on every request.
- On 2026-11-17, a temporary client page that imported the database module failed `next build` with the `server-only` error. The page was then deleted.
- Two GET requests to `/api/feed` on the dev server returned the same 30 profiles in different orders.
- Not tested: whether Next.js would have spotted the synchronous reads with Cache Components on. It was turned off instead.

## Troubleshooting

- **`tsc --noEmit` failed: "Cannot find name 'LayoutProps'".** Next.js generates its route types into `.next/types`, which doesn't exist in a fresh clone. Fix: `npm run typecheck` runs `next typegen` before `tsc`.
