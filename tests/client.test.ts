import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { resetDeck, sendSwipe, type SwipeAttempt } from "@/lib/client/api";
import { deckReducer, initialDeck, swipeFromDrag, type DeckState } from "@/lib/client/deck";
import { NO_FILTERS, countFilters, filterChoices, filterProfiles } from "@/lib/client/filters";
import { msUntilThemeChange, resolveTheme, themeAt } from "@/lib/client/theme";
import {
  LEFT_HANDS,
  MATCH_SCENE_MS,
  OPENING,
  OWL,
  PUT_DOWN,
  QUICK_PICK,
  REACTIONS,
  RIGHT_HANDS,
  WAITING,
  createRoutine,
  reactionFor,
  type Beat,
  type Reaction,
} from "@/lib/client/mascot";
import { OwlRig, solveWing } from "@/lib/client/owl-rig";
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

describe("resetDeck", () => {
  it("reports success only when the server confirms it", async () => {
    const answering = (status: number) => (async () => new Response(null, { status })) as unknown as typeof fetch;
    expect(await resetDeck(answering(200))).toBe(true);
    expect(await resetDeck(answering(403))).toBe(false);
    expect(await resetDeck(answering(500))).toBe(false);
    expect(await resetDeck((async () => { throw new TypeError("offline"); }) as unknown as typeof fetch)).toBe(false);
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

  it("counts only matches the server confirmed, until Matches is opened", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    deck = deckReducer(deck, { type: "swipeSaved", matched: false });
    expect(deck.newMatches).toBe(0);
    deck = deckReducer(deck, { type: "swipeStarted", profile: kabir, action: "like" });
    deck = deckReducer(deck, { type: "swipeSaved", matched: true });
    expect(deck.newMatches).toBe(1);
    expect(deckReducer(deck, { type: "matchesSeen" }).newMatches).toBe(0);
  });

  it("forgets the last run when the user starts over", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    deck = deckReducer(deck, { type: "swipeSaved", matched: true });
    deck = deckReducer(deck, { type: "deckReset" });
    expect(deck).toEqual({ ...initialDeck, resets: 1 });
  });

  it("only marks a swipe slow while one is pending", () => {
    expect(deckReducer(readyDeck(), { type: "swipeSlow" }).pending).toBeNull();
    const started = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    expect(deckReducer(started, { type: "swipeSlow" }).pending?.slow).toBe(true);
  });
});

/** A repeatable stand-in for Math.random, so a failing routine can be replayed. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("the owl", () => {
  const effects = (beats: Beat[]) => beats.map((beat) => beat.effect);

  it("reacts only to the user's own swipe and the server's final answer", () => {
    expect(reactionFor("pass", false)).toBe("setAside");
    expect(reactionFor("like", false)).toBe("pinToBoard");
    expect(reactionFor("like", true)).toBe("match");
  });

  it("aligns the stars only for a confirmed match", () => {
    expect(effects(REACTIONS.match)).toContain("align");
    const others: Reaction[] = ["setAside", "pinToBoard", "putBack", "celebrate"];
    for (const reaction of others) expect(effects(REACTIONS[reaction])).not.toContain("align");
    for (const beats of [OPENING, WAITING, QUICK_PICK, PUT_DOWN]) expect(effects(beats)).not.toContain("align");
  });

  it("never aligns the stars during ordinary work", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const next = createRoutine(seededRandom(seed));
      for (let turn = 0; turn < 60; turn++) expect(effects(next())).not.toContain("align");
    }
  });

  it("waits the same way for every swipe, with nothing that depends on the answer", () => {
    expect(effects(WAITING).filter(Boolean)).toEqual([]);
  });

  it("opens the match screen only after the room has played the match", () => {
    expect(MATCH_SCENE_MS).toBeGreaterThan(1000);
    expect(MATCH_SCENE_MS).toBeLessThan(2600);
  });

  it("varies its work instead of repeating one loop", () => {
    const next = createRoutine(seededRandom(7));
    const stretches = Array.from({ length: 24 }, () => JSON.stringify(next()));
    expect(new Set(stretches).size).toBeGreaterThan(20);
  });

  it("looks up at the stars every few postcards", () => {
    const next = createRoutine(seededRandom(11));
    let sinceStars = 0;
    for (let turn = 0; turn < 200; turn++) {
      const beats = next();
      sinceStars = effects(beats).includes("glint") ? 0 : sinceStars + 1;
      expect(sinceStars).toBeLessThan(16);
    }
  });

  it("puts down every postcard it picks up during ordinary work", () => {
    const next = createRoutine(seededRandom(3));
    for (let turn = 0; turn < 100; turn++) {
      const done = effects(next());
      expect(done.filter((effect) => effect === "take").length).toBe(done.filter((effect) => effect === "file").length);
    }
  });

  it("can reach every place its wings are sent, allowing for leaning over", () => {
    const longest = OWL.upperWing + OWL.foreWing;
    const lean = 34;
    for (const point of Object.values(LEFT_HANDS)) {
      expect(Math.hypot(point.x - OWL.shoulderLeft.x, point.y - OWL.shoulderLeft.y)).toBeLessThan(longest + lean);
    }
    for (const point of Object.values(RIGHT_HANDS)) {
      expect(Math.hypot(point.x - OWL.shoulderRight.x, point.y - OWL.shoulderRight.y)).toBeLessThan(longest + lean);
    }
  });

  it("records a saved swipe without anything about the other person", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    expect(deck.lastSaved).toBeNull();
    deck = deckReducer(deck, { type: "swipeSaved", matched: false });
    expect(deck.lastSaved).toEqual({ seq: 1, action: "like", matched: false });
    deck = deckReducer(deck, { type: "swipeStarted", profile: kabir, action: "pass" });
    deck = deckReducer(deck, { type: "swipeSaved", matched: false });
    expect(deck.lastSaved).toEqual({ seq: 2, action: "pass", matched: false });
  });

  it("doesn't count a swipe that wasn't confirmed, and tells the owl it came back", () => {
    let deck = deckReducer(readyDeck(), { type: "swipeStarted", profile: ananya, action: "like" });
    expect(deck.returned).toBe(0);
    deck = deckReducer(deck, { type: "swipeReturned", message: "Try again." });
    expect(deck.lastSaved).toBeNull();
    expect(deck.returned).toBe(1);
  });
});

describe("the owl's rig", () => {
  it("brings a joint to rest on its target", () => {
    const rig = new OwlRig();
    rig.aim({ tilt: 12 });
    for (let frame = 0; frame < 300; frame++) rig.advance(1 / 60);
    expect(rig.get("tilt")).toBeCloseTo(12, 1);
  });

  it("moves the eyes before the body", () => {
    const rig = new OwlRig();
    rig.aim({ gazeX: 1, lean: 1 });
    for (let frame = 0; frame < 6; frame++) rig.advance(1 / 60);
    expect(rig.get("gazeX")).toBeGreaterThan(rig.get("lean") * 2);
  });

  it("isn't thrown off by one very long frame", () => {
    const rig = new OwlRig();
    rig.aim({ cardX: 100 });
    rig.advance(30);
    expect(Math.abs(rig.get("cardX"))).toBeLessThan(120);
  });

  it("places the wing tip exactly on a target within reach", () => {
    const shoulder = { x: 212, y: 250 };
    const target = { x: 160, y: 296 };
    const { upper, fore, tip } = solveWing(shoulder, target, 50, 60, 1);
    expect(tip.x).toBeCloseTo(target.x, 3);
    expect(tip.y).toBeCloseTo(target.y, 3);

    const a = ((upper + 90) * Math.PI) / 180;
    const b = a + (fore * Math.PI) / 180;
    expect(shoulder.x + 50 * Math.cos(a) + 60 * Math.cos(b)).toBeCloseTo(target.x, 3);
    expect(shoulder.y + 50 * Math.sin(a) + 60 * Math.sin(b)).toBeCloseTo(target.y, 3);
  });

  it("stretches towards a target that is too far away", () => {
    const shoulder = { x: 0, y: 0 };
    const { tip } = solveWing(shoulder, { x: 500, y: 0 }, 50, 60, 1);
    expect(tip.x).toBeCloseTo(110, 1);
    expect(tip.y).toBeCloseTo(0, 3);
  });

  it("bends the two wings' elbows opposite ways", () => {
    const target = { x: 0, y: 80 };
    const left = solveWing({ x: 0, y: 0 }, target, 50, 60, 1);
    const right = solveWing({ x: 0, y: 0 }, target, 50, 60, -1);
    expect(Math.sign(left.upper)).toBe(-Math.sign(right.upper));
  });
});

describe("filters", () => {
  const people: PublicProfile[] = [
    { ...ananya, city: "Pune", college: "Fergusson College", interests: ["Cricket", "Chai"] },
    { ...kabir, city: "Jaipur", college: null, interests: ["History"] },
    { ...profile("diya"), city: "Pune", college: null, interests: ["Film", "Chai"] },
  ];
  const ids = (list: PublicProfile[]) => list.map((person) => person.id);

  it("keeps everyone, in the same order, when nothing is selected", () => {
    expect(filterProfiles(people, NO_FILTERS)).toEqual(people);
  });

  it("filters by city and by campus", () => {
    expect(ids(filterProfiles(people, { ...NO_FILTERS, city: "Pune" }))).toEqual(["ananya", "diya"]);
    expect(ids(filterProfiles(people, { ...NO_FILTERS, campus: "Fergusson College" }))).toEqual(["ananya"]);
  });

  it("matches anyone who shares at least one chosen interest", () => {
    expect(ids(filterProfiles(people, { ...NO_FILTERS, interests: ["History", "Film"] }))).toEqual(["kabir", "diya"]);
  });

  it("requires every kind of filter to match", () => {
    expect(ids(filterProfiles(people, { city: "Pune", campus: null, interests: ["History"] }))).toEqual([]);
  });

  it("counts what is selected", () => {
    expect(countFilters(NO_FILTERS)).toBe(0);
    expect(countFilters({ city: "Pune", campus: "Fergusson College", interests: ["Chai", "Film"] })).toBe(4);
  });

  it("offers only what is left, but keeps a selection that has run out", () => {
    const choices = filterChoices(people, { city: "Delhi", campus: null, interests: ["Poetry"] });
    expect(choices.cities).toEqual(["Delhi", "Jaipur", "Pune"]);
    expect(choices.campuses).toEqual(["Fergusson College"]);
    expect(choices.interests[0]).toBe("Poetry");
    expect(choices.interests).toContain("Chai");
  });
});

describe("day and night", () => {
  const at = (hours: number, minutes = 0) => new Date(2026, 10, 18, hours, minutes);

  it.each([
    [5, 59, "night"],
    [6, 0, "day"],
    [12, 0, "day"],
    [18, 29, "day"],
    [18, 30, "night"],
    [23, 59, "night"],
    [0, 0, "night"],
  ] as const)("at %i:%i it is %s", (hours, minutes, theme) => {
    expect(themeAt(at(hours, minutes))).toBe(theme);
  });

  it("lets a chosen theme override the clock", () => {
    expect(resolveTheme("night", at(12))).toBe("night");
    expect(resolveTheme("day", at(23))).toBe("day");
    expect(resolveTheme("auto", at(23))).toBe("night");
  });

  it("knows exactly when the next change is due", () => {
    expect(msUntilThemeChange(at(5, 30))).toBe(30 * 60_000);
    expect(msUntilThemeChange(at(18, 0))).toBe(30 * 60_000);
    expect(msUntilThemeChange(at(23, 0))).toBe(7 * 60 * 60_000);
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

  it("draws every avatar without loading anything from another site", () => {
    for (const { name } of SEED_PROFILES) {
      const svg = readFileSync(path.join("public", "avatars", `${name.toLowerCase()}.svg`), "utf8");
      expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', ""), name).not.toMatch(/https?:|<image/);
    }
  });
});
