# Coy Discover architecture diagrams

## Summary (SOART)

- **Scenario:** Coy Discover is a swipe-based Discover tab, built as a take-home for the Coy SDE intern role. It must only match on a mutual like and never reveal who liked the user before that.
- **Obstacle:** the privacy guarantees live in a few SQL queries, one transaction and one allowlist function. Without pictures it's hard to see where a like is stored, what reaches the browser and where a match is decided.
- **Action:** one diagram per view, drawn from the code as it is after the backend phase (commit `cedb7fa`). Solid lines and boxes are built; dashed ones are planned.
- **Result:** you can follow a swipe from the request to the committed rows, see exactly which fields reach the browser, what happens on a double tap or a changed swipe, and how the database is seeded and reset. Section 12 lists each way a like could leak and what stops it.
- **Troubleshooting:** the diagrams are only useful while they're accurate, so they're updated at the end of every phase, alongside the README.

**Contents**

1. [System context](#1-system-context)
2. [What runs where](#2-what-runs-where)
3. [Server modules](#3-server-modules)
4. [Data model](#4-data-model)
5. [What reaches the browser](#5-what-reaches-the-browser)
6. [Loading the feed](#6-loading-the-feed)
7. [Liking someone who already liked you](#7-liking-someone-who-already-liked-you)
8. [How a swipe is decided](#8-how-a-swipe-is-decided)
9. [Swipe states for one profile](#9-swipe-states-for-one-profile)
10. [A double tap, then a changed swipe](#10-a-double-tap-then-a-changed-swipe)
11. [Seeding and reset](#11-seeding-and-reset)
12. [Ways a like could leak, and what stops each one](#12-ways-a-like-could-leak-and-what-stops-each-one)
13. [The Discover UI (planned)](#13-the-discover-ui-planned)
14. [Tests](#14-tests)

---

## 1. System context

Who and what Coy Discover deals with. The brief has no sign-in, so there's one logged-in user. Coy's real app isn't connected: this is a standalone app with no access to Coy's code. Until the Discover UI is built, the API is reached with curl and the tests.

```mermaid
flowchart LR
    User(["You<br/>the one logged-in user"])
    Reviewer(["Reviewer<br/>clones the public repo"])
    Client["curl and tests"]
    Coy["Coy's real app<br/>app.getcoy.com"]

    subgraph App["Coy Discover, running locally"]
        UI["Discover tab<br/>swipe deck, match screen, Matches"]
        API["API<br/>/api/feed, /api/swipe, /api/matches"]
        DB[("SQLite<br/>data/coy.db")]
    end

    User -. "swipes" .-> UI
    UI -. "fetch" .-> API
    Client --> API
    API --> DB
    Reviewer -- "npm install, npm run dev" --> App
    Coy ~~~ App

    class UI,Coy planned
    classDef planned stroke-dasharray: 5 5
```

Coy's app is drawn dashed and unconnected on purpose: nothing links the two.

## 2. What runs where

Everything runs in one Node.js process. The database is a single file that's created and seeded on the first request.

```mermaid
flowchart LR
    Browser["Browser"]
    Curl["curl, Vitest"]
    Reset["npm run reset<br/>scripts/reset.mjs"]

    subgraph Node["One Node.js process: next dev or next start"]
        Pages["Pages<br/>/ is a placeholder today"]
        Handlers["Route handlers<br/>src/app/api/*/route.ts"]
        Server["Server modules<br/>src/lib/server/*<br/>marked server-only"]
        Conn["One SQLite connection<br/>kept on globalThis"]
    end

    File[("data/coy.db<br/>gitignored")]

    Browser --> Pages
    Browser -. "planned: the Discover UI calls the API" .-> Handlers
    Curl --> Handlers
    Handlers --> Server --> Conn --> File
    Reset -- "deletes the file;<br/>the next request re-seeds" --> File
```

## 3. Server modules

Every module that touches the database or the seed starts with `import "server-only"`, so the build fails if browser code imports one ([ADR-004](adr/004-nextjs-route-handlers-server-only.md)). Only `types.ts` and `random.ts` are safe for the browser. All three routes, and `seed.ts`, also read `ME_ID` from `database.ts`; those arrows are left out to keep the picture readable.

```mermaid
flowchart TB
    subgraph Routes["src/app/api: the three route handlers"]
        Feed["feed/route.ts<br/>GET"]
        Swipe["swipe/route.ts<br/>POST, validates the body"]
        Matches["matches/route.ts<br/>GET"]
    end

    subgraph Server["src/lib/server: server-only"]
        Store["store.ts<br/>getDb: open, seed, reopen after reset"]
        Discover["discover.ts<br/>getFeed, recordSwipe, getMatches,<br/>toPublicProfile (the allowlist)"]
        Http["http.ts<br/>error shape, no-store header"]
        Database["database.ts<br/>schema, ME_ID, openDatabase"]
        Seed["seed.ts<br/>random UUIDs, 8 random likers"]
        Profiles["seed-profiles.ts<br/>30 fictional profiles"]
    end

    subgraph Shared["src/lib: safe for the browser"]
        Types["types.ts<br/>public shapes"]
        Random["random.ts<br/>Fisher–Yates shuffle"]
    end

    Routes -- "getDb()" --> Store
    Routes -- "getFeed, recordSwipe, getMatches" --> Discover
    Routes -- "errors, no-store" --> Http
    Store -- "open" --> Database
    Store -- "seed an empty database" --> Seed
    Seed --> Profiles
    Seed -- "pick the likers" --> Random
    Discover -- "shuffle the feed" --> Random
    Discover --> Types
```

## 4. Data model

Three tables. Who liked whom is a row in `swipes`, which only the server reads. Each pair has at most one swipe in each direction (the primary key) and at most one match, because the two ids are stored in sorted order ([ADR-003](adr/003-sqlite-with-node-sqlite.md)).

```mermaid
erDiagram
    profiles ||--o{ swipes : "makes (from_id)"
    profiles ||--o{ swipes : "receives (to_id)"
    profiles ||--o{ matches : "user_a"
    profiles ||--o{ matches : "user_b"

    profiles {
        TEXT id PK "random UUID, or me for the user"
        TEXT name
        INTEGER age "CHECK age >= 18"
        TEXT city
        TEXT college "NULL for people who work"
        TEXT bio
        TEXT interests "JSON array"
        TEXT avatar_url
    }

    swipes {
        TEXT from_id PK, FK
        TEXT to_id PK, FK
        TEXT action "like or pass"
        TEXT created_at
    }

    matches {
        TEXT user_a PK, FK "the smaller id"
        TEXT user_b PK, FK "the larger id"
        TEXT matched_at "time of the like that completed it"
    }
```

Two checks the diagram can't show: `swipes` has `CHECK (from_id <> to_id)`, and `matches` has `CHECK (user_a < user_b)`.

## 5. What reaches the browser

The trust boundary. Anything on the browser side can be read in DevTools, so only the allowlisted fields and the match result cross it ([ADR-001](adr/001-server-decides-matches.md)).

```mermaid
flowchart LR
    subgraph ServerSide["Server only"]
        Rows[("profiles, swipes, matches")]
        Allow["toPublicProfile<br/>the allowlist"]
        Decide["recordSwipe<br/>decides the match"]
    end

    subgraph BrowserSide["Browser: readable in DevTools"]
        Card["Feed card: id, name, age, city,<br/>college, bio, interests, avatarUrl"]
        Result["Swipe result: matched true or false"]
        List["Matches: the same fields plus matchedAt"]
    end

    Never["Never sent: who liked you, swipe rows,<br/>the other person's like time"]

    Rows --> Allow
    Allow --> Card
    Allow --> List
    Rows --> Decide --> Result
    Rows -.-x Never
```

`matched` is only true when the like is mutual, which is the moment the brief says to reveal it.

## 6. Loading the feed

The feed query only reads the user's own swipes. It never reads anyone's likes of the user, so the order and contents of the feed can't depend on them.

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as feed/route.ts
    participant S as store.ts
    participant D as discover.ts
    participant DB as SQLite

    B->>R: GET /api/feed
    R->>S: getDb()
    S-->>R: the connection (seeded on first use)
    R->>D: getFeed(db, "me")
    D->>DB: profiles that aren't me and that I haven't swiped on
    Note over D,DB: Reads swipes FROM me only
    DB-->>D: rows in stored order
    D->>D: toPublicProfile on each row, then a Fisher–Yates shuffle
    D-->>R: PublicProfile list
    R-->>B: 200 with profiles, Cache-Control no-store
```

## 7. Liking someone who already liked you

In this example Ananya is one of the 8 profiles picked at seed time to have liked the user. The browser learns it only from `matched: true`, after the user has liked her back.

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as swipe/route.ts
    participant D as discover.ts
    participant DB as SQLite

    B->>R: POST /api/swipe with profileId Ananya, action like
    R->>R: parse and validate the body (400 if bad)
    R->>D: recordSwipe(db, "me", Ananya, like)
    D->>DB: does Ananya exist? (404 if not, or if it's me)
    D->>DB: BEGIN IMMEDIATE, taking the write lock
    D->>DB: have I swiped on Ananya before?
    DB-->>D: no
    D->>DB: INSERT swipe me to Ananya, like
    D->>DB: has Ananya liked me?
    DB-->>D: yes
    D->>DB: INSERT match, ids sorted, matched_at now
    D->>DB: COMMIT
    D-->>R: ok, matched true
    R-->>B: 200, matched true
    Note over B: It's a match! screen (planned)
```

## 8. How a swipe is decided

Every path through `POST /api/swipe`. A pass returns before the server looks up whether the other person liked the user, so even the timing of a pass can't depend on it.

```mermaid
flowchart TD
    Start(["POST /api/swipe"]) --> IsJson{"Body is JSON?"}
    IsJson -- no --> Bad1["400: The request body must be JSON."]
    IsJson -- yes --> Valid{"profileId is a string and<br/>action is like or pass?"}
    Valid -- no --> Bad2["400: send profileId and action"]
    Valid -- yes --> Exists{"Profile exists<br/>and isn't you?"}
    Exists -- no --> NotFound["404: Profile not found."]
    Exists -- yes --> Lock["BEGIN IMMEDIATE"]
    Lock --> Before{"Swiped on this<br/>profile before?"}
    Before -- "yes, same action" --> Same["200: the original answer"]
    Before -- "yes, different action" --> Conflict["409: A different swipe<br/>has already been recorded."]
    Before -- no --> Insert["INSERT the swipe"]
    Insert --> Action{"like or pass?"}
    Action -- pass --> Pass["200: matched false<br/>no lookup of their like"]
    Action -- like --> Back{"Did they already<br/>like you?"}
    Back -- no --> NoMatch["200: matched false"]
    Back -- yes --> Match["INSERT the match<br/>200: matched true"]
```

## 9. Swipe states for one profile

Every swipe is final ([ADR-002](adr/002-swipes-are-final.md)).

```mermaid
stateDiagram-v2
    [*] --> InFeed: database seeded
    InFeed --> Passed: you pass
    InFeed --> Liked: you like, they haven't liked you
    InFeed --> Matched: you like, they already liked you

    note right of Liked
        All three states are final.
        The same swipe again gets the original answer.
        A different swipe gets 409.
        None of them comes back to the feed.
    end note
```

In a two-sided app, Liked would become Matched when the other person liked you later. Here the seeded profiles never swipe after seeding, so that can't happen.

## 10. A double tap, then a changed swipe

A drag release and a button tap can send the same like twice. The second gets the first one's answer. A later pass on the same profile is refused.

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as /api/swipe
    participant DB as SQLite

    B->>API: like Kabir (drag released)
    B->>API: like Kabir (button tapped at the same moment)
    API->>DB: first request: BEGIN IMMEDIATE, no earlier swipe, INSERT, COMMIT
    API-->>B: 200, matched false
    API->>DB: second request: BEGIN IMMEDIATE, earlier like found, same action
    API-->>B: 200, matched false (the original answer, nothing written)
    B->>API: pass Kabir (sent later with curl)
    API->>DB: earlier like found, different action
    API-->>B: 409, A different swipe has already been recorded.
```

`node:sqlite` is synchronous, so inside one Node process the two requests run one after the other anyway. `BEGIN IMMEDIATE` and the primary key protect the data if more than one process ever writes.

## 11. Seeding and reset

The database creates and seeds itself, so a reviewer only runs `npm install` and `npm run dev`. Ids and likers are new on every seed ([ADR-005](adr/005-random-ids-likers-at-seed-time-shuffled-feed.md)).

```mermaid
flowchart TD
    Req(["Any API request"]) --> Get["getDb()"]
    Get --> Ready{"Connection open, same path,<br/>and the file still there?"}
    Ready -- yes --> Use["use it"]
    Ready -- no --> Fresh["close any old connection,<br/>create data/ if needed"]
    Fresh --> Open["open data/coy.db,<br/>CREATE TABLE IF NOT EXISTS"]
    Open --> Empty{"No profiles yet?"}
    Empty -- no --> Use
    Empty -- yes --> Seed["insert me and 30 profiles with random UUIDs;<br/>pick 8 at random to like me"]
    Seed --> Log["log the count only:<br/>8 of them have already liked you"]
    Log --> Use
    Reset(["npm run reset"]) --> Delete["delete data/coy.db"]
    Delete -. "on the next request" .-> Get
```

## 12. Ways a like could leak, and what stops each one

| Leak | What stops it | Checked by |
|---|---|---|
| A "liked you" field in a response | `toPublicProfile` builds eight fields; rows are never sent as they are | Tests: exact key set for feed and matches |
| Likers first in the feed | Fisher–Yates shuffle on every request | Test: likers' average position over 2,000 feeds |
| Ids that follow seed order | A random UUID for every profile on every seed | Test: ids are version 4 UUIDs |
| Likers readable in the public seed file | Likers are picked when seeding and exist only in the database | Test: different seeds pick different likers |
| A pass that looks different on a liker | A pass returns `matched: false` before any lookup | Test: byte-identical HTTP responses |
| Like, see the match, then pass to take it back | Swipes are final; a change gets 409 | Tests: conflicts for likers and non-likers |
| Error messages that depend on the other person | Fixed 400, 404 and 409 messages | Test: identical 409 bodies |
| Swiping as someone else | The server fixes who "me" is; the body can't name the swiper | Test: a `fromId` in the body is ignored |
| Guessing an endpoint such as `/likes` | Three API routes, none of which returns swipes | `next build` lists the three routes |
| Database or seed code shipped to the browser | `server-only` on every server module; nothing in `public/` | A client import failed the build (checked once, 2026-11-17) |
| Timing a request | A pass never looks up their like; a like already returns the answer | Not tested; reasoned from the code |

## 13. The Discover UI (planned)

Not built yet. The API calls on the right exist; everything dashed is still to be designed in step 2, including the drag gesture, the animation and the avatars.

```mermaid
flowchart TB
    subgraph Shell["App shell with a tab bar"]
        Home["Home tab<br/>blank, as the brief asks"]
        Discover["Discover tab"]
    end

    Discover --> Deck["Card deck<br/>one card at a time"]
    Deck -- "drag right or Like" --> SwipeApi["POST /api/swipe"]
    Deck -- "drag left or Pass" --> SwipeApi
    SwipeApi -- "matched true" --> MatchScreen["It's a match! screen"]
    Deck -- "no cards left" --> Empty["Empty state"]
    Deck -- "on load" --> FeedApi["GET /api/feed"]
    Discover --> MatchesView["Matches view"]
    MatchesView --> MatchesApi["GET /api/matches"]

    class Home,Discover,Deck,MatchScreen,Empty,MatchesView planned
    classDef planned stroke-dasharray: 5 5
    style Shell stroke-dasharray: 5 5
```

## 14. Tests

32 Vitest tests, run with `npm test`. Three deliberate bugs (no shuffle, likers sorted first, a changed swipe overwriting the first) each made tests fail before the code was restored.

| File | Tests | What it covers |
|---|---|---|
| [tests/discover.test.ts](../tests/discover.test.ts) | 17 | The logic on an in-memory database: seeding, feed contents and fields, the shuffle and its fairness, every swipe rule, matches |
| [tests/routes.test.ts](../tests/routes.test.ts) | 15 | The HTTP layer on a temporary database file: status codes, bodies, headers, a `fromId` in the body, persistence across a restart, reset |
