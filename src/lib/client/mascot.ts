import type { SwipeAction } from "../types";
import type { Joint, Point } from "./owl-rig";

type Targets = Partial<Record<Joint, number>>;

export const LOOKS = {
  ahead: { tilt: 0, turn: 0, nod: 0, gazeX: 0, gazeY: 0.1 },
  inbox: { tilt: -9, turn: -0.85, nod: 0.7, gazeX: -0.8, gazeY: 0.8 },
  outbox: { tilt: 9, turn: 0.85, nod: 0.7, gazeX: 0.8, gazeY: 0.8 },
  tray: { tilt: -14, turn: -1, nod: 0.7, gazeX: -1, gazeY: 0.7 },
  card: { tilt: 2, turn: 0, nod: 1, gazeX: 0, gazeY: 0.95 },
  cock: { tilt: -18, turn: -0.25, nod: 0.7, gazeX: 0.2, gazeY: 0.9 },
  cockOther: { tilt: 16, turn: 0.25, nod: 0.7, gazeX: -0.2, gazeY: 0.9 },
  board: { tilt: 10, turn: 0.9, nod: -0.8, gazeX: 0.85, gazeY: -0.85 },
  viewer: { tilt: -6, turn: 0, nod: 0.05, gazeX: 0, gazeY: 0 },
  cup: { tilt: 8, turn: 0.8, nod: 0.6, gazeX: 0.9, gazeY: 0.6 },
  sip: { tilt: -7, turn: 0.2, nod: -0.7, gazeX: 0.2, gazeY: -0.2 },
  slot: { tilt: -8, turn: -0.7, nod: -0.5, gazeX: -0.8, gazeY: -0.5 },
  up: { tilt: 0, turn: 0, nod: -1, gazeX: 0, gazeY: -0.8 },
  shakeA: { tilt: -5, turn: -0.75, nod: 0.2, gazeX: -0.5, gazeY: 0.3 },
  shakeB: { tilt: 5, turn: 0.75, nod: 0.2, gazeX: 0.5, gazeY: 0.3 },
} satisfies Record<string, Targets>;

export const BODIES = {
  rest: { lean: 0, shift: 0, rise: 0, squash: 0 },
  left: { lean: -5, shift: -14, rise: 2, squash: 0.01 },
  right: { lean: 5, shift: 14, rise: 2, squash: 0.01 },
  farRight: { lean: 8, shift: 26, rise: 3, squash: 0.015 },
  close: { lean: 0, shift: 0, rise: 5, squash: 0.03 },
  tall: { lean: 2, shift: 4, rise: -7, squash: -0.025 },
  thump: { lean: -1, shift: -2, rise: 8, squash: 0.055 },
  hop: { lean: 0, shift: 0, rise: -20, squash: -0.05 },
} satisfies Record<string, Targets>;

export const MOODS = {
  calm: { lid: 0.08, joy: 0, brow: 0 },
  focus: { lid: 0.24, joy: 0, brow: 0.7 },
  wide: { lid: 0, joy: 0, brow: 0.35 },
  sleepy: { lid: 0.62, joy: 0, brow: -0.2 },
  worried: { lid: 0.04, joy: 0, brow: -1 },
  joy: { lid: 0, joy: 1, brow: 0.4 },
} satisfies Record<string, Targets>;

/** The owl's measurements, in the units of the desk drawing. */
export const OWL = {
  pivot: { x: 262, y: 330 },
  shoulderLeft: { x: 212, y: 250 },
  shoulderRight: { x: 312, y: 250 },
  upperWing: 50,
  foreWing: 60,
} as const;

export const PILES = {
  inbox: { x: 156, y: 325 },
  outbox: { x: 380, y: 325 },
  tray: { x: 76, y: 325 },
} as const;

export const PILE_STEP = 4.5;

/** How far up a pile the next postcard lies. */
export function pileTop(pile: keyof typeof PILES, count: number) {
  return PILES[pile].y - count * PILE_STEP;
}

export const PROP_HOMES = {
  cup: { x: 436, y: 312 },
  stamp: { x: 322, y: 312 },
} as const;

export type Prop = keyof typeof PROP_HOMES;

export const LEFT_HANDS = {
  rest: { x: 204, y: 326 },
  inbox: { x: 160, y: 296 },
  cheer: { x: 158, y: 188 },
  stretch: { x: 172, y: 214 },
} satisfies Record<string, Point>;

export const RIGHT_HANDS = {
  rest: { x: 320, y: 326 },
  outbox: { x: 376, y: 300 },
  chin: { x: 284, y: 216 },
  point: { x: 414, y: 176 },
  specs: { x: 306, y: 150 },
  cheer: { x: 366, y: 188 },
  stretch: { x: 352, y: 214 },
  cup: { x: 430, y: 300 },
  mouth: { x: 300, y: 214 },
  stampHome: { x: 322, y: 292 },
  stampUp: { x: 272, y: 256 },
  stampDown: { x: 268, y: 298 },
  pat: { x: 380, y: 284 },
  patDown: { x: 380, y: 298 },
} satisfies Record<string, Point>;

export type LeftHand = keyof typeof LEFT_HANDS | "card";
export type RightHand = keyof typeof RIGHT_HANDS | "card" | "card2";

interface Spot {
  x: number;
  y: number;
  rot: number;
  flat: number;
  scale: number;
}

/** Where a held postcard can be. `flat` is 1 when it faces the viewer and about 0.5 lying down. */
export const CARD_SPOTS = {
  inbox: { x: PILES.inbox.x, y: PILES.inbox.y, rot: -3, flat: 0.5, scale: 1 },
  hold: { x: 262, y: 266, rot: -2, flat: 1, scale: 1 },
  read: { x: 262, y: 256, rot: 2, flat: 1, scale: 1.08 },
  readLeft: { x: 248, y: 258, rot: -9, flat: 1, scale: 1.05 },
  readRight: { x: 276, y: 258, rot: 8, flat: 1, scale: 1.05 },
  lamp: { x: 322, y: 226, rot: 12, flat: 1, scale: 1 },
  desk: { x: 262, y: 325, rot: 1, flat: 0.5, scale: 1 },
  outboxAbove: { x: 358, y: 278, rot: 6, flat: 0.8, scale: 1 },
  outbox: { x: PILES.outbox.x, y: PILES.outbox.y, rot: 3, flat: 0.5, scale: 1 },
  trayAbove: { x: 132, y: 274, rot: -10, flat: 0.8, scale: 1 },
  tray: { x: PILES.tray.x, y: PILES.tray.y, rot: -6, flat: 0.5, scale: 1 },
  raise: { x: 338, y: 176, rot: -14, flat: 1, scale: 1 },
  meetWait: { x: 214, y: 268, rot: 8, flat: 1, scale: 1 },
  meetLeft: { x: 240, y: 256, rot: 16, flat: 1, scale: 1 },
  meetRight: { x: 284, y: 256, rot: -16, flat: 1, scale: 1 },
} satisfies Record<string, Spot>;

export type CardSpot = keyof typeof CARD_SPOTS;

/** Something that happens in the scene as well as the owl moving. */
export type SceneEffect =
  | "take"
  | "takeSecond"
  | "file"
  | "putAside"
  | "putBack"
  | "fly"
  | "glint"
  | "spark"
  | "align"
  | "release"
  | "gripCup"
  | "gripStamp"
  | "dropProp"
  | "postmark"
  | "settle";

export interface Beat {
  ms: number;
  look?: keyof typeof LOOKS;
  body?: keyof typeof BODIES;
  mood?: keyof typeof MOODS;
  left?: LeftHand;
  right?: RightHand;
  card?: CardSpot;
  card2?: CardSpot;
  /** True shows the written side of the held postcard. */
  flipped?: boolean;
  effect?: SceneEffect;
}

export type Reaction = "setAside" | "pinToBoard" | "match" | "celebrate" | "putBack";

/**
 * What the owl does after a saved swipe. It only ever hears about the user's own swipe and
 * the server's final answer, so it can't hint at who has liked the user.
 */
export function reactionFor(action: SwipeAction, matched: boolean): Reaction {
  if (matched) return "match";
  return action === "like" ? "pinToBoard" : "setAside";
}

/** Takes the next postcard quickly, when something needs one in hand. */
export const QUICK_PICK: Beat[] = [
  { ms: 170, look: "inbox", body: "left", left: "inbox", right: "rest", mood: "calm" },
  { ms: 130, effect: "take", left: "card", card: "inbox" },
];

/** Held while any swipe is being saved. It is the same for every swipe. */
export const WAITING: Beat[] = [
  { ms: 320, look: "card", body: "rest", left: "card", right: "rest", card: "hold", mood: "focus" },
  { ms: 480, look: "board", right: "chin" },
];

/** Puts an unused postcard back on the pile before going on with the work. */
const RETURN_CARD: Beat[] = [
  { ms: 340, look: "inbox", body: "left", left: "card", right: "rest", card: "inbox" },
  { ms: 110, effect: "putBack", left: "inbox" },
];

export const PUT_DOWN: Beat[] = [...RETURN_CARD, { ms: 320, look: "ahead", body: "rest", left: "rest" }];

const MATCH_BEATS: Beat[] = [
  { ms: 200, look: "card", body: "rest", mood: "wide", left: "card", right: "outbox", card: "meetWait", flipped: false },
  { ms: 200, effect: "takeSecond", right: "card2", card2: "outbox" },
  { ms: 430, look: "card", card: "meetLeft", card2: "meetRight", mood: "focus" },
  { ms: 220, effect: "spark", mood: "joy", body: "close" },
  { ms: 620, effect: "align", look: "board", body: "tall" },
  { ms: 430, effect: "release", left: "cheer", right: "cheer", body: "hop" },
];

/** How long the match plays out in the room before the match screen opens. */
export const MATCH_SCENE_MS = MATCH_BEATS.reduce((total, beat) => total + beat.ms, 0);

export const REACTIONS: Record<Reaction, Beat[]> = {
  setAside: [
    { ms: 220, look: "card", body: "rest", left: "card", right: "rest", card: "hold", mood: "calm" },
    { ms: 330, look: "tray", body: "left", card: "trayAbove" },
    { ms: 280, card: "tray", left: "rest" },
    { ms: 110, effect: "putAside" },
    { ms: 420, look: "ahead", body: "rest" },
  ],
  pinToBoard: [
    { ms: 240, look: "card", body: "rest", left: "card", right: "card", card: "hold", mood: "wide" },
    { ms: 400, look: "board", body: "right", left: "rest", card: "raise" },
    { ms: 150, effect: "fly", right: "point" },
    { ms: 1050, look: "board", body: "tall", mood: "calm" },
    { ms: 420, look: "ahead", body: "rest", right: "rest" },
  ],
  putBack: [
    { ms: 280, look: "card", body: "rest", mood: "worried", left: "card", right: "rest", card: "hold" },
    ...RETURN_CARD,
    { ms: 170, look: "shakeA", body: "rest", left: "rest" },
    { ms: 170, look: "shakeB" },
    { ms: 170, look: "shakeA" },
    { ms: 420, look: "ahead", mood: "calm" },
  ],
  match: [
    ...MATCH_BEATS,
    { ms: 320, body: "rest" },
    { ms: 380, body: "hop" },
    { ms: 400, body: "rest", left: "rest", right: "rest", look: "ahead" },
  ],
  celebrate: [
    { ms: 360, look: "board", mood: "joy", left: "cheer", right: "cheer", body: "hop" },
    { ms: 320, body: "rest" },
    { ms: 360, body: "hop" },
    { ms: 700, body: "rest", left: "rest", right: "rest", effect: "settle" },
    { ms: 500, look: "ahead", mood: "calm" },
  ],
};

/** The moment the owl settles in when Discover opens. */
export const OPENING: Beat[] = [
  { ms: 620, look: "viewer", body: "tall", left: "rest", right: "rest", mood: "wide" },
  { ms: 480, right: "specs", look: "ahead" },
  { ms: 340, right: "rest", body: "rest", mood: "calm" },
];

type Vary = (ms: number) => number;

function pickUp(vary: Vary): Beat[] {
  return [
    { ms: vary(560), look: "inbox", body: "left", mood: "calm", left: "inbox", right: "rest" },
    { ms: vary(300), effect: "take", left: "card", card: "inbox" },
    { ms: vary(560), look: "card", body: "close", card: "hold", right: "card", mood: "focus" },
  ];
}

function fileAway(vary: Vary, rest: number): Beat[] {
  return [
    { ms: vary(540), look: "outbox", body: "right", left: "rest", card: "outboxAbove", mood: "calm", flipped: false },
    { ms: 300, card: "outbox" },
    { ms: 130, effect: "file", right: "outbox" },
    { ms: vary(500), look: "ahead", body: "rest", right: "rest" },
    { ms: rest },
  ];
}

const examining: Record<string, (vary: Vary) => Beat[]> = {
  plain: (vary) => [
    { ms: vary(1050), card: "read" },
    { ms: vary(540), flipped: true },
    { ms: vary(820), card: "hold" },
  ],
  careful: (vary) => [
    { ms: vary(760), card: "readLeft", look: "cock" },
    { ms: vary(760), card: "readRight", look: "cockOther" },
    { ms: vary(560), flipped: true, card: "read", look: "card" },
    { ms: vary(900), mood: "wide" },
    { ms: vary(540), flipped: false, mood: "focus" },
    { ms: vary(520), card: "hold" },
  ],
  quick: (vary) => [
    { ms: vary(620), card: "read" },
    { ms: vary(280), look: "viewer", mood: "calm" },
    { ms: vary(320), look: "card" },
  ],
  lamp: (vary) => [
    { ms: vary(620), card: "lamp", left: "rest", look: "outbox", body: "right", mood: "wide" },
    { ms: vary(420), flipped: true },
    { ms: vary(1000), look: "cockOther", mood: "focus" },
    { ms: vary(520), card: "hold", left: "card", look: "card", body: "close" },
  ],
  stamp: (vary) => [
    { ms: vary(760), card: "read" },
    { ms: vary(520), flipped: true },
    { ms: vary(520), card: "desk", right: "stampHome", look: "card", body: "close" },
    { ms: 260, effect: "gripStamp" },
    { ms: vary(460), right: "stampUp" },
    { ms: 120, right: "stampDown", body: "thump" },
    { ms: 140, effect: "postmark" },
    { ms: vary(420), right: "stampHome", body: "close", mood: "wide" },
    { ms: 220, effect: "dropProp" },
    { ms: vary(420), right: "card", card: "hold" },
  ],
};

const interludes: ((vary: Vary) => Beat[])[] = [
  // A sip of chai.
  (vary) => [
    { ms: vary(620), look: "cup", body: "farRight", right: "cup", mood: "calm" },
    { ms: 240, effect: "gripCup" },
    { ms: vary(620), right: "mouth", body: "rest", look: "sip", mood: "sleepy" },
    { ms: vary(1150) },
    { ms: vary(640), right: "cup", body: "farRight", look: "cup", mood: "calm" },
    { ms: 200, effect: "dropProp" },
    { ms: vary(620), right: "rest", body: "rest", look: "ahead" },
  ],
  // A long stretch.
  (vary) => [
    { ms: vary(680), left: "stretch", right: "stretch", body: "tall", look: "up", mood: "sleepy" },
    { ms: vary(780) },
    { ms: vary(620), left: "rest", right: "rest", body: "rest", look: "ahead", mood: "calm" },
  ],
  // Squaring up the finished pile.
  (vary) => [
    { ms: vary(560), right: "pat", body: "right", look: "outbox" },
    { ms: 170, right: "patDown" },
    { ms: 190, right: "pat" },
    { ms: 170, right: "patDown" },
    { ms: vary(500), right: "rest", body: "rest", look: "ahead" },
  ],
  // Noticing someone is watching.
  (vary) => [
    { ms: vary(420), look: "viewer", mood: "wide" },
    { ms: vary(1200) },
    { ms: vary(320), look: "cock" },
    { ms: vary(620), look: "ahead", mood: "calm" },
  ],
  // A quick check of the stars, without stopping work.
  (vary) => [
    { ms: vary(520), look: "board", mood: "wide" },
    { ms: vary(1100) },
    { ms: vary(420), look: "ahead", mood: "calm" },
  ],
];

function stargaze(vary: Vary): Beat[] {
  return [
    { ms: vary(620), look: "board", body: "tall", mood: "wide", left: "rest", right: "rest" },
    { ms: vary(1350) },
    { ms: vary(560), right: "point", effect: "glint" },
    { ms: vary(980) },
    { ms: vary(420), right: "chin", mood: "focus", body: "rest" },
    { ms: vary(1000), look: "cockOther" },
    { ms: vary(480), look: "ahead", right: "rest", mood: "calm" },
    { ms: vary(900) },
  ];
}

/**
 * Builds the owl's working day. Each call returns the next stretch of work, chosen at random
 * with slightly different timing, so the routine never settles into a visible loop.
 */
export function createRoutine(random: () => number = Math.random) {
  const vary: Vary = (ms) => Math.round(ms * (0.84 + random() * 0.36));
  const styles = Object.keys(examining);
  let sorted = 0;
  let starsAfter = 3;
  let lastStyle = "";
  let lastInterlude = -1;

  return function nextRoutine(): Beat[] {
    if (sorted >= starsAfter) {
      sorted = 0;
      starsAfter = 2 + Math.floor(random() * 3);
      return stargaze(vary);
    }

    if (random() < 0.26) {
      let pick = Math.floor(random() * interludes.length);
      if (pick === lastInterlude) pick = (pick + 1) % interludes.length;
      lastInterlude = pick;
      return interludes[pick](vary);
    }

    let style = styles[Math.floor(random() * styles.length)];
    if (style === lastStyle) style = styles[(styles.indexOf(style) + 1) % styles.length];
    lastStyle = style;
    sorted += 1;
    return [...pickUp(vary), ...examining[style](vary), ...fileAway(vary, vary(700 + random() * 1500))];
  };
}
