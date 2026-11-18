import { describe, expect, it } from "vitest";
import { ME_ID } from "@/lib/server/database";
import { getFeed, getMatches, recordSwipe } from "@/lib/server/discover";
import { LIKER_COUNT, startOver } from "@/lib/server/seed";
import { SEED_PROFILES } from "@/lib/server/seed-profiles";
import { shuffle } from "@/lib/random";
import {
  allProfileIds,
  count,
  freshDb,
  likerIds,
  nonLikerIds,
  PUBLIC_FIELDS,
  seededRng,
} from "./helpers";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("starting over", () => {
  it("clears the user's swipes and matches and keeps every profile", () => {
    const db = freshDb();
    const ids = allProfileIds(db).sort();
    recordSwipe(db, ME_ID, likerIds(db)[0], "like");
    recordSwipe(db, ME_ID, nonLikerIds(db)[0], "pass");

    startOver(db, seededRng(2));

    expect(allProfileIds(db).sort()).toEqual(ids);
    expect(getFeed(db, ME_ID)).toHaveLength(SEED_PROFILES.length);
    expect(getMatches(db, ME_ID)).toEqual([]);
    expect(count(db, "matches")).toBe(0);
    expect(count(db, "swipes")).toBe(LIKER_COUNT);
  });

  it("picks new likers, so an earlier run doesn't give the answers away", () => {
    const db = freshDb(1);
    const before = likerIds(db).sort();
    startOver(db, seededRng(99));
    const after = likerIds(db).sort();
    expect(after).toHaveLength(LIKER_COUNT);
    expect(after).not.toEqual(before);
  });
});

describe("seed", () => {
  it("creates every seeded profile with a random UUID and some likes of the user", () => {
    const db = freshDb();
    const ids = allProfileIds(db);
    expect(ids).toHaveLength(SEED_PROFILES.length);
    expect(ids.length).toBeGreaterThanOrEqual(30);
    for (const id of ids) expect(id).toMatch(UUID);
    expect(likerIds(db)).toHaveLength(LIKER_COUNT);
  });

  it("picks a different set of likers on different seeds", () => {
    const names = (seed: number) => {
      const db = freshDb(seed);
      return likerIds(db)
        .map((id) => String(db.prepare("SELECT name FROM profiles WHERE id = ?").get(id)?.name))
        .sort();
    };
    expect(names(1)).not.toEqual(names(2));
  });
});

describe("GET feed", () => {
  it("returns every profile except the user, with only the public fields", () => {
    const db = freshDb();
    const feed = getFeed(db, ME_ID, seededRng(7));
    expect(feed).toHaveLength(SEED_PROFILES.length);
    expect(feed.map((p) => p.id)).not.toContain(ME_ID);
    for (const profile of feed) expect(Object.keys(profile).sort()).toEqual(PUBLIC_FIELDS);
  });

  it("leaves out profiles the user has swiped on, likes and passes alike", () => {
    const db = freshDb();
    const [liked, passed] = allProfileIds(db);
    recordSwipe(db, ME_ID, liked, "like");
    recordSwipe(db, ME_ID, passed, "pass");
    const ids = getFeed(db, ME_ID).map((p) => p.id);
    expect(ids).not.toContain(liked);
    expect(ids).not.toContain(passed);
    expect(ids).toHaveLength(SEED_PROFILES.length - 2);
  });

  it("is empty once every profile has been swiped", () => {
    const db = freshDb();
    for (const id of allProfileIds(db)) recordSwipe(db, ME_ID, id, "pass");
    expect(getFeed(db, ME_ID)).toEqual([]);
  });

  it("comes back in a new order on each request", () => {
    const db = freshDb();
    const rng = seededRng(5);
    const first = getFeed(db, ME_ID, rng).map((p) => p.id);
    const second = getFeed(db, ME_ID, rng).map((p) => p.id);
    expect(second).not.toEqual(first);
    expect([...second].sort()).toEqual([...first].sort());
  });

  it("doesn't bunch the profiles who liked the user together", () => {
    // Over many shuffles, likers should sit at the same average position as everyone else.
    const db = freshDb();
    const likers = new Set(likerIds(db));
    const rng = seededRng(42);
    const runs = 2000;
    let positionSum = 0;
    let likerCount = 0;
    for (let run = 0; run < runs; run++) {
      getFeed(db, ME_ID, rng).forEach((profile, index) => {
        if (likers.has(profile.id)) {
          positionSum += index;
          likerCount += 1;
        }
      });
    }
    const middle = (SEED_PROFILES.length - 1) / 2;
    expect(Math.abs(positionSum / likerCount - middle)).toBeLessThan(0.5);
  });
});

describe("shuffle", () => {
  it("makes every order about equally likely", () => {
    const rng = seededRng(3);
    const counts = new Map<string, number>();
    const runs = 60000;
    for (let run = 0; run < runs; run++) {
      const key = shuffle(["a", "b", "c"], rng).join("");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const n of counts.values()) expect(Math.abs(n - runs / 6)).toBeLessThan(runs / 6 / 20);
  });
});

describe("POST swipe", () => {
  it("makes a match when the user likes someone who already liked them", () => {
    const db = freshDb();
    const [liker] = likerIds(db);
    expect(recordSwipe(db, ME_ID, liker, "like")).toEqual({ kind: "ok", matched: true });
    expect(count(db, "matches")).toBe(1);
  });

  it("doesn't make a match when the other person hasn't liked the user", () => {
    const db = freshDb();
    const [stranger] = nonLikerIds(db);
    expect(recordSwipe(db, ME_ID, stranger, "like")).toEqual({ kind: "ok", matched: false });
    expect(count(db, "matches")).toBe(0);
  });

  it("answers a pass the same way whether or not the other person liked the user", () => {
    const db = freshDb();
    const passOnLiker = recordSwipe(db, ME_ID, likerIds(db)[0], "pass");
    const passOnStranger = recordSwipe(db, ME_ID, nonLikerIds(db)[0], "pass");
    expect(passOnLiker).toEqual(passOnStranger);
    expect(count(db, "matches")).toBe(0);
  });

  it("gives a repeated swipe the original answer and stores it once", () => {
    const db = freshDb();
    const [liker] = likerIds(db);
    const [stranger] = nonLikerIds(db);
    const swipesBefore = count(db, "swipes");

    expect(recordSwipe(db, ME_ID, liker, "like")).toEqual({ kind: "ok", matched: true });
    expect(recordSwipe(db, ME_ID, liker, "like")).toEqual({ kind: "ok", matched: true });
    expect(recordSwipe(db, ME_ID, stranger, "pass")).toEqual({ kind: "ok", matched: false });
    expect(recordSwipe(db, ME_ID, stranger, "pass")).toEqual({ kind: "ok", matched: false });

    expect(count(db, "swipes")).toBe(swipesBefore + 2);
    expect(count(db, "matches")).toBe(1);
  });

  it("refuses a different second swipe, the same way for likers and non-likers", () => {
    const db = freshDb();
    const [liker, liker2] = likerIds(db);
    const [stranger, stranger2] = nonLikerIds(db);

    recordSwipe(db, ME_ID, liker, "like");
    recordSwipe(db, ME_ID, stranger, "like");
    recordSwipe(db, ME_ID, liker2, "pass");
    recordSwipe(db, ME_ID, stranger2, "pass");

    // Like then pass can't retract a match; pass then like can't create one.
    expect(recordSwipe(db, ME_ID, liker, "pass")).toEqual({ kind: "conflict" });
    expect(recordSwipe(db, ME_ID, stranger, "pass")).toEqual({ kind: "conflict" });
    expect(recordSwipe(db, ME_ID, liker2, "like")).toEqual({ kind: "conflict" });
    expect(recordSwipe(db, ME_ID, stranger2, "like")).toEqual({ kind: "conflict" });
    expect(count(db, "matches")).toBe(1);
  });

  it("treats an unknown profile or the user themselves as not found", () => {
    const db = freshDb();
    expect(recordSwipe(db, ME_ID, "no-such-profile", "like")).toEqual({ kind: "not_found" });
    expect(recordSwipe(db, ME_ID, ME_ID, "like")).toEqual({ kind: "not_found" });
  });

  it("has the database refuse a second swipe for the same pair even if the code is bypassed", () => {
    const db = freshDb();
    const [profile] = allProfileIds(db);
    recordSwipe(db, ME_ID, profile, "like");
    expect(() =>
      db
        .prepare("INSERT INTO swipes (from_id, to_id, action, created_at) VALUES (?, ?, 'pass', ?)")
        .run(ME_ID, profile, new Date().toISOString()),
    ).toThrow(/UNIQUE constraint failed/);
  });
});

describe("GET matches", () => {
  it("lists only mutual matches, newest first, stamped with the user's completing like", () => {
    const db = freshDb();
    const [liker1, liker2] = likerIds(db);
    const [stranger] = nonLikerIds(db);
    const first = new Date("2026-11-17T10:00:00.000Z");
    const second = new Date("2026-11-17T11:00:00.000Z");

    recordSwipe(db, ME_ID, liker1, "like", first);
    recordSwipe(db, ME_ID, stranger, "like", first);
    recordSwipe(db, ME_ID, liker2, "like", second);

    const matches = getMatches(db, ME_ID);
    expect(matches.map((m) => m.id)).toEqual([liker2, liker1]);
    expect(matches.map((m) => m.matchedAt)).toEqual([second.toISOString(), first.toISOString()]);
    for (const match of matches) {
      expect(Object.keys(match).sort()).toEqual([...PUBLIC_FIELDS, "matchedAt"].sort());
    }
  });

  it("is empty before any mutual like", () => {
    const db = freshDb();
    recordSwipe(db, ME_ID, likerIds(db)[0], "pass");
    recordSwipe(db, ME_ID, nonLikerIds(db)[0], "like");
    expect(getMatches(db, ME_ID)).toEqual([]);
  });
});
