import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getFeedRoute } from "@/app/api/feed/route";
import { GET as getMatchesRoute } from "@/app/api/matches/route";
import { POST as postSwipeRoute } from "@/app/api/swipe/route";
import { getDb } from "@/lib/server/store";
import { SEED_PROFILES } from "@/lib/server/seed-profiles";
import type { FeedResponse, MatchesResponse } from "@/lib/types";
import { likerIds, nonLikerIds, PUBLIC_FIELDS } from "./helpers";

let dir: string;

beforeEach(() => {
  // Each test gets its own database file, created and seeded on first use, as in the app.
  dir = mkdtempSync(path.join(tmpdir(), "coy-discover-"));
  process.env.COY_DB_PATH = path.join(dir, "coy.db");
});

afterEach(() => {
  delete process.env.COY_DB_PATH;
  rmSync(dir, { recursive: true, force: true });
});

function swipe(body: unknown): Promise<Response> {
  return postSwipeRoute(
    new Request("http://localhost/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function feed(): Promise<FeedResponse> {
  return (await getFeedRoute().json()) as FeedResponse;
}

describe("GET /api/feed", () => {
  it("seeds on first use and returns public fields only, never cached", async () => {
    const response = getFeedRoute();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const { profiles } = (await response.json()) as FeedResponse;
    expect(profiles).toHaveLength(SEED_PROFILES.length);
    for (const profile of profiles) expect(Object.keys(profile).sort()).toEqual(PUBLIC_FIELDS);
  });
});

describe("POST /api/swipe", () => {
  it("returns { matched: true } for a like on someone who liked the user", async () => {
    getDb();
    const response = await swipe({ profileId: likerIds(getDb())[0], action: "like" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ matched: true });
  });

  it("sends byte-for-byte the same pass response for a liker and a non-liker", async () => {
    const db = getDb();
    const onLiker = await swipe({ profileId: likerIds(db)[0], action: "pass" });
    const onStranger = await swipe({ profileId: nonLikerIds(db)[0], action: "pass" });
    expect(onLiker.status).toBe(onStranger.status);
    expect(await onLiker.text()).toBe(await onStranger.text());
  });

  it("sends the same 409 for a changed swipe whether or not the other person liked the user", async () => {
    const db = getDb();
    const liker = likerIds(db)[0];
    const stranger = nonLikerIds(db)[0];
    await swipe({ profileId: liker, action: "like" });
    await swipe({ profileId: stranger, action: "like" });

    const onLiker = await swipe({ profileId: liker, action: "pass" });
    const onStranger = await swipe({ profileId: stranger, action: "pass" });
    expect(onLiker.status).toBe(409);
    expect(await onLiker.json()).toEqual({
      success: false,
      message: "A different swipe has already been recorded.",
    });
    expect(onStranger.status).toBe(409);
    expect(await onStranger.json()).toEqual({
      success: false,
      message: "A different swipe has already been recorded.",
    });
  });

  it("gives a double tap the original answer", async () => {
    const liker = likerIds(getDb())[0];
    const first = await swipe({ profileId: liker, action: "like" });
    const second = await swipe({ profileId: liker, action: "like" });
    expect(second.status).toBe(first.status);
    expect(await second.json()).toEqual(await first.json());
  });

  it.each([
    ["not JSON", "{not json"],
    ["no action", { profileId: "x" }],
    ["an unknown action", { profileId: "x", action: "superlike" }],
    ["no profile id", { action: "like" }],
    ["a list", []],
  ])("rejects %s with 400", async (_label, body) => {
    const response = await swipe(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
  });

  it("returns 404 for an unknown profile and for the user themselves", async () => {
    expect((await swipe({ profileId: "no-such-profile", action: "like" })).status).toBe(404);
    expect((await swipe({ profileId: "me", action: "like" })).status).toBe(404);
  });

  it("ignores any attempt in the body to swipe as someone else", async () => {
    const db = getDb();
    const [liker, stranger] = [likerIds(db)[0], nonLikerIds(db)[0]];
    await swipe({ profileId: stranger, action: "like", fromId: liker });
    const row = db.prepare("SELECT from_id FROM swipes WHERE to_id = ?").get(stranger);
    expect(row?.from_id).toBe("me");
  });
});

describe("GET /api/matches", () => {
  it("lists mutual matches only", async () => {
    const db = getDb();
    const liker = likerIds(db)[0];
    await swipe({ profileId: liker, action: "like" });
    await swipe({ profileId: nonLikerIds(db)[0], action: "like" });

    const { matches } = (await getMatchesRoute().json()) as MatchesResponse;
    expect(matches.map((m) => m.id)).toEqual([liker]);
  });
});

describe("persistence", () => {
  it("keeps swipes and matches after the server restarts", async () => {
    const liker = likerIds(getDb())[0];
    await swipe({ profileId: liker, action: "like" });

    // Simulate a restart: drop the open connection so the next call reopens the file.
    const holder = globalThis as { coyDb?: { db: { close(): void } } };
    holder.coyDb?.db.close();
    delete holder.coyDb;

    expect((await feed()).profiles.map((p) => p.id)).not.toContain(liker);
    const { matches } = (await getMatchesRoute().json()) as MatchesResponse;
    expect(matches.map((m) => m.id)).toEqual([liker]);
  });

  it("starts fresh with a new seed after the database file is deleted", async () => {
    const before = (await feed()).profiles.map((p) => p.id);
    rmSync(process.env.COY_DB_PATH!, { force: true });
    const after = (await feed()).profiles.map((p) => p.id);
    expect(after).toHaveLength(before.length);
    expect(after.filter((id) => before.includes(id))).toEqual([]);
  });
});
