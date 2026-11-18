import type { PublicProfile, SwipeAction } from "../types";

export interface PendingSwipe {
  profile: PublicProfile;
  action: SwipeAction;
  /** True once the server has taken long enough to be worth mentioning. */
  slow: boolean;
}

/** The latest swipe the server confirmed. It holds nothing about the other person. */
export interface SavedSwipe {
  seq: number;
  action: SwipeAction;
  matched: boolean;
}

export interface DeckState {
  feed: "loading" | "ready" | "error";
  /** Everyone left to swipe on. A profile stays here until the server confirms the swipe. */
  profiles: PublicProfile[];
  pending: PendingSwipe | null;
  notice: string | null;
  match: PublicProfile | null;
  lastSaved: SavedSwipe | null;
  /** How many swipes came back unconfirmed. */
  returned: number;
  /** Matches the server has confirmed since the user last opened Matches. */
  newMatches: number;
  /** How many times the user has started over, so the room can clear its board. */
  resets: number;
}

export type DeckEvent =
  | { type: "feedRequested" }
  | { type: "feedLoaded"; profiles: PublicProfile[]; match?: PublicProfile | null; notice?: string | null }
  | { type: "feedFailed" }
  | { type: "swipeStarted"; profile: PublicProfile; action: SwipeAction }
  | { type: "swipeSlow" }
  | { type: "swipeSaved"; matched: boolean }
  | { type: "swipeReturned"; message: string }
  | { type: "matchClosed" }
  | { type: "matchesSeen" }
  | { type: "deckReset" };

export const initialDeck: DeckState = {
  feed: "loading",
  profiles: [],
  pending: null,
  notice: null,
  match: null,
  lastSaved: null,
  returned: 0,
  newMatches: 0,
  resets: 0,
};

export function deckReducer(state: DeckState, event: DeckEvent): DeckState {
  switch (event.type) {
    case "feedRequested":
      return { ...state, feed: "loading", notice: null };
    case "feedLoaded":
      return {
        ...state,
        feed: "ready",
        profiles: event.profiles,
        pending: null,
        match: event.match ?? null,
        notice: event.notice ?? null,
      };
    case "feedFailed":
      return { ...state, feed: "error", pending: null };
    case "swipeStarted":
      return { ...state, pending: { profile: event.profile, action: event.action, slow: false }, notice: null };
    case "swipeSlow":
      return state.pending ? { ...state, pending: { ...state.pending, slow: true } } : state;
    case "swipeSaved": {
      if (!state.pending) return state;
      const { profile, action } = state.pending;
      return {
        ...state,
        lastSaved: { seq: (state.lastSaved?.seq ?? 0) + 1, action, matched: event.matched },
        profiles: state.profiles.filter((p) => p.id !== profile.id),
        pending: null,
        match: event.matched ? profile : null,
        newMatches: state.newMatches + (event.matched ? 1 : 0),
      };
    }
    case "swipeReturned":
      return { ...state, pending: null, notice: event.message, returned: state.returned + 1 };
    case "matchClosed":
      return { ...state, match: null };
    case "matchesSeen":
      return { ...state, newMatches: 0 };
    case "deckReset":
      return { ...initialDeck, resets: state.resets + 1 };
  }
}

/** A drag counts once it passes this share of the card's width... */
export const SWIPE_DISTANCE_SHARE = 0.3;
/** ...or is flicked at least this fast, in pixels per second. */
export const SWIPE_FLICK_SPEED = 500;
/** A flick this short is treated as a slip of the finger. */
const MIN_FLICK_DISTANCE = 24;

/** Decides what letting go of a dragged card means. Null means the card springs back. */
export function swipeFromDrag(offsetX: number, velocityX: number, cardWidth: number): SwipeAction | null {
  const distance = cardWidth * SWIPE_DISTANCE_SHARE;
  if (offsetX >= distance) return "like";
  if (offsetX <= -distance) return "pass";
  if (offsetX >= MIN_FLICK_DISTANCE && velocityX >= SWIPE_FLICK_SPEED) return "like";
  if (offsetX <= -MIN_FLICK_DISTANCE && velocityX <= -SWIPE_FLICK_SPEED) return "pass";
  return null;
}
