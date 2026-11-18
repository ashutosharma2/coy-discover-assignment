import type { SwipeAction } from "../types";

export type Pose = "idle" | "reach" | "read" | "flip" | "file" | "look" | "point" | "wait" | "aside" | "pin" | "joy";

/** Something the scene does at the start of a step, as well as changing the pigeon's pose. */
export type SceneEffect = "fly" | "light" | "link" | "heart";

export interface Step {
  pose: Pose;
  ms: number;
  effect?: SceneEffect;
}

export type Reaction = "setAside" | "pinToChart" | "match" | "celebrate";

/**
 * What the pigeon does after a saved swipe. It only ever hears about the user's own swipe and
 * the server's final answer, so it can't hint at who has liked the user.
 */
export function reactionFor(action: SwipeAction, matched: boolean): Reaction {
  if (matched) return "match";
  return action === "like" ? "pinToChart" : "setAside";
}

/** The pose held while a swipe is being saved. It is the same for every swipe. */
export const WAITING_POSE: Pose = "wait";

export const REACTIONS: Record<Reaction, Step[]> = {
  setAside: [
    { pose: "read", ms: 380 },
    { pose: "aside", ms: 820 },
    { pose: "idle", ms: 500 },
  ],
  pinToChart: [
    { pose: "read", ms: 380 },
    { pose: "pin", ms: 820, effect: "fly" },
    { pose: "look", ms: 1000, effect: "light" },
    { pose: "idle", ms: 500 },
  ],
  match: [
    { pose: "pin", ms: 760, effect: "fly" },
    { pose: "look", ms: 640, effect: "light" },
    { pose: "joy", ms: 1700, effect: "heart" },
    { pose: "idle", ms: 400 },
  ],
  celebrate: [
    { pose: "joy", ms: 1900 },
    { pose: "idle", ms: 500 },
  ],
};

function sortPostcard(rest: number): Step[] {
  return [
    { pose: "reach", ms: 880 },
    { pose: "read", ms: 1350 },
    { pose: "flip", ms: 1000 },
    { pose: "read", ms: 760 },
    { pose: "file", ms: 900 },
    { pose: "idle", ms: rest },
  ];
}

const STARGAZE: Step[] = [
  { pose: "look", ms: 2300 },
  { pose: "point", ms: 1250, effect: "link" },
  { pose: "look", ms: 1000 },
  { pose: "idle", ms: 2200 },
];

const RESTS = [1700, 2600, 1300];

/** The pigeon sorts three postcards, then stops to study the stars. */
export function nextRoutine(turn: number): Step[] {
  const position = turn % 4;
  return position === 3 ? STARGAZE : sortPostcard(RESTS[position]);
}
