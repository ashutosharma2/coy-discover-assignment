"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import type { MatchedProfile, PublicProfile, SwipeAction } from "../types";
import { fetchFeed, fetchMatches, resetDeck, sendSwipe } from "./api";
import { deckReducer, initialDeck } from "./deck";
import { submitSwipe } from "./swipe-flow";

/** Fast swipes shouldn't flash a saving message, so it waits this long before appearing. */
const SAVING_MESSAGE_DELAY_MS = 400;

/** "returned" means the swipe wasn't confirmed, so the card has to come back. */
export type SwipeResolution = "settled" | "returned";

/**
 * The deck lives here, above the tabs, and the feed is fetched once per page load.
 * The server shuffles on every request, so fetching again on each visit would reorder the deck.
 */
export function useDiscover() {
  const [deck, dispatch] = useReducer(deckReducer, initialDeck);

  useEffect(() => {
    let ignore = false;
    fetchFeed()
      .then((profiles) => {
        if (!ignore) dispatch({ type: "feedLoaded", profiles });
      })
      .catch(() => {
        if (!ignore) dispatch({ type: "feedFailed" });
      });
    return () => {
      ignore = true;
    };
  }, []);

  const reload = useCallback(async (notice?: string) => {
    dispatch({ type: "feedRequested" });
    try {
      dispatch({ type: "feedLoaded", profiles: await fetchFeed(), notice });
    } catch {
      dispatch({ type: "feedFailed" });
    }
  }, []);

  /** The first swipe on this profile stands, so ask the server what is true now. */
  const reconcile = useCallback(async (profile: PublicProfile) => {
    try {
      const [profiles, matches] = await Promise.all([fetchFeed(), fetchMatches()]);
      dispatch({
        type: "feedLoaded",
        profiles,
        match: matches.find((m) => m.id === profile.id) ?? null,
        notice: `Your first swipe on ${profile.name} stands.`,
      });
    } catch {
      dispatch({ type: "feedFailed" });
    }
  }, []);

  const swipe = useCallback(
    async (profile: PublicProfile, action: SwipeAction, flown: Promise<void>): Promise<SwipeResolution> => {
      dispatch({ type: "swipeStarted", profile, action });
      const slowTimer = setTimeout(() => dispatch({ type: "swipeSlow" }), SAVING_MESSAGE_DELAY_MS);

      // Wait for both, so a match screen never interrupts the card leaving.
      const [result] = await Promise.all([
        submitSwipe(() => sendSwipe({ profileId: profile.id, action })),
        flown,
      ]);
      clearTimeout(slowTimer);

      switch (result.kind) {
        case "ok":
          dispatch({ type: "swipeSaved", matched: result.matched });
          return "settled";
        case "conflict":
          await reconcile(profile);
          return "settled";
        case "not_found":
          await reload("The profiles changed, so the deck has been refreshed.");
          return "settled";
        case "rejected":
        case "unknown":
          dispatch({
            type: "swipeReturned",
            message: "Not saved. Check your connection and swipe again.",
          });
          return "returned";
      }
    },
    [reconcile, reload],
  );

  const closeMatch = useCallback(() => dispatch({ type: "matchClosed" }), []);
  const markMatchesSeen = useCallback(() => dispatch({ type: "matchesSeen" }), []);

  /** The deck only changes once the server has confirmed the reset. */
  const startOver = useCallback(async (): Promise<boolean> => {
    if (!(await resetDeck())) return false;
    dispatch({ type: "deckReset" });
    await reload();
    return true;
  }, [reload]);

  return { deck, swipe, reload, closeMatch, markMatchesSeen, startOver };
}

export interface MatchesState {
  status: "idle" | "loading" | "ready" | "error";
  items: MatchedProfile[];
}

/** Matches are fetched each time the Matches view opens. */
export function useMatches() {
  const [matches, setMatches] = useState<MatchesState>({ status: "idle", items: [] });

  const load = useCallback(async () => {
    setMatches((current) => ({ ...current, status: current.items.length > 0 ? "ready" : "loading" }));
    try {
      setMatches({ status: "ready", items: await fetchMatches() });
    } catch {
      setMatches((current) => ({ ...current, status: "error" }));
    }
  }, []);

  return { matches, load };
}
