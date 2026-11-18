import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { sendSwipe, type SwipeAttempt } from "@/lib/client/api";
import { deckReducer, initialDeck, swipeFromDrag, type DeckState } from "@/lib/client/deck";
import { RETRY_DELAYS_MS, submitSwipe } from "@/lib/client/swipe-flow";
import { SEED_PROFILES } from "@/lib/server/seed-profiles";
import type { PublicProfile } from "@/lib/types";

function profile(id: string): PublicProfile {
  return { id, name: id, age: 21, city: "Pune", college: null, bio: "", interests: [], avatarUrl: `/avatars/${id}.svg` };
}

const ananya = profile("ananya");
const kabir = profile("kabir");

function readyDeck(): DeckState {
  return deckReducer(initialDeck, { type: "feedLoaded", profiles: [ananya, kabir] });
}

describe("sendSwipe", () => {
  const swipe = { profileId: "ananya", action: "like" } as const;
  const answering = (status: number, body: unknown = {}) =>
    (async () => Response.json(body, { status })) as unknown as typeof fetch;

  it.each<[string, typeof fetch, SwipeAttempt]>([
    ["a 200 with a match", answering(200, { matched: true }), { kind: "ok", matched: true }],
    ["a 200 without a match", answering(200, { matched: false }), { kind: "ok", matched: false }],
    ["a 409", answering(409), { kind: "conflict" }],
    ["a 404", answering(404), { kind: "not_found" }],
    ["a 400", answering(400), { kind: "rejected" }],
    ["a 500", answering(500), { kind: "unknown" }],
    ["a 503", answering(503), { kind: "unknown" }],
    ["a network failure", (async () => { throw new TypeError("offline"); }) as unknown as typeof fetch, { kind: "unknown" }],
    ["a 200 with an unreadable body", (async () => new Response("not json")) as unknown as typeof fetch, { kind: "unknown" }],
  ])("reads %s", async (_label, fetchFn, expected) => {
    expect(await sendSwipe(swipe, fetchFn)).toEqual(expected);
  });

  it("sends only the profile and the action", async () => {
    const fetchFn = vi.fn(answering(200, { matched: false }));
    await sendSwipe(swipe, fetchFn);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("/api/swipe");
    expect(JSON.parse(String(init?.body))).toEqual({ profileId: "ananya", action: "like" });
  });
});

describe("submitSwipe", () => {
  const noWait = async () => {};

  it("sends once when the first answer is real", async () => {
    const send = vi.fn(async (): Promise<SwipeAttempt> => ({ kind: "ok", matched: true }));
    expect(await submitSwipe(send, noWait)).toEqual({ kind: "ok", matched: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("retries an unknown result and returns the server's answer", async () => {
    const send = vi
      .fn<() => Promise<SwipeAttempt>>()
      .mockResolvedValueOnce({ kind: "unknown" })
      .mockResolvedValueOnce({ kind: "ok", matched: true });
    expect(await submitSwipe(send, noWait)).toEqual({ kind: "ok", matched: true });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("gives up after three attempts, waiting 0.5 s and then 1.5 s", async () => {
    const send = vi.fn(async (): Promise<SwipeAttempt> => ({ kind: "unknown" }));
    const wait = vi.fn<(ms: number) => Promise<void>>(noWait);
    expect(await submitSwipe(send, wait)).toEqual({ kind: "unknown" });
    expect(send).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length);
    expect(wait.mock.calls.map(([ms]) => ms)).toEqual([500, 1500]);
  });

  it.each<[SwipeAttempt]>([[{ kind: "conflict" }], [{ kind: "not_found" }], [{ kind: "rejected" }]])(
    "doesn't retry %j, because the server answered",
    async (answer) => {
      const send = vi.fn(async () => answer);
      expect(await submitSwipe(send, noWait)).toEqual(answer);
      expect(send).toHaveBeenCalledTimes(1);
    },
  );
});

describe("deck", () => {
  it("keeps the card until the server confirms the swipe", () => {
    const started = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    expect(started.profiles[0]).toBe(ananya);
    expect(started.pending?.profile).toBe(ananya);
  });

  it("removes the card once saved and moves to the next one", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "pass" });
    deck = deckReducer(deck, { type: "swipeSaved", matched: false });
    expect(deck.profiles).toEqual([kabir]);
    expect(deck.pending).toBeNull();
    expect(deck.match).toBeNull();
  });

  it("shows a match only when the server says so", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    expect(deck.match).toBeNull();
    deck = deckReducer(deck, { type: "swipeSaved", matched: true });
    expect(deck.match).toBe(ananya);
    expect(deckReducer(deck, { type: "matchClosed" }).match).toBeNull();
  });

  it("keeps the card and explains when a swipe can't be confirmed", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    deck = deckReducer(deck, { type: "swipeReturned", message: "Try again." });
    expect(deck.profiles).toEqual([ananya, kabir]);
    expect(deck.pending).toBeNull();
    expect(deck.notice).toBe("Try again.");
  });

  it("replaces the deck with the server's version after a conflict", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "pass" });
    deck = deckReducer(deck, { type: "feedLoaded", profiles: [kabir], match: ananya, notice: "First swipe stands." });
    expect(deck.profiles).toEqual([kabir]);
    expect(deck.match).toBe(ananya);
    expect(deck.pending).toBeNull();
    expect(deck.notice).toBe("First swipe stands.");
  });

  it("only marks a swipe slow while one is pending", () => {
    expect(deckReducer(readyDeck(), { type: "swipeSlow" }).pending).toBeNull();
    const started = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    expect(deckReducer(started, { type: "swipeSlow" }).pending?.slow).toBe(true);
  });
});

describe("swipeFromDrag", () => {
  const width = 300;

  it.each([
    ["past 30% to the right", 90, 0, "like"],
    ["past 30% to the left", -90, 0, "pass"],
    ["a fast flick right", 40, 600, "like"],
    ["a fast flick left", -40, -600, "pass"],
    ["a short slow drag", 60, 100, null],
    ["a tiny fast twitch", 10, 900, null],
    ["a flick back towards the middle", 60, -800, null],
  ])("treats %s correctly", (_label, offset, velocity, expected) => {
    expect(swipeFromDrag(offset, velocity, width)).toBe(expected);
  });
});

describe("avatars", () => {
  it("has a local avatar file for every seeded profile", () => {
    for (const { name } of SEED_PROFILES) {
      expect(existsSync(path.join("public", "avatars", `${name.toLowerCase()}.svg`)), name).toBe(true);
    }
  });
});
