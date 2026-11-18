"use client";

import { animate, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import type { DeckState } from "@/lib/client/deck";
import type { SwipeResolution } from "@/lib/client/use-discover";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";

interface SwipeDeckProps {
  deck: DeckState;
  swipe: (profile: PublicProfile, action: SwipeAction, flown: Promise<void>) => Promise<SwipeResolution>;
  reload: () => Promise<void>;
  openMatches: () => void;
  keyboardActive: boolean;
  dragProgress: MotionValue<number>;
}

export function SwipeDeck({ deck, swipe, reload, openMatches, keyboardActive, dragProgress }: SwipeDeckProps) {
  const topCard = useRef<SwipeCardHandle>(null);
  const busy = useRef(false);

  const top = deck.profiles[0];
  const next = deck.profiles[1];
  const locked = deck.pending !== null;

  const commit = useCallback(
    async (action: SwipeAction) => {
      if (!top || busy.current) return;
      busy.current = true;
      const flown = topCard.current?.fly(action) ?? Promise.resolve();
      const resolution = await swipe(top, action, flown);
      if (resolution === "returned") topCard.current?.comeBack();
      void animate(dragProgress, 0, { duration: 0.3 });
      busy.current = false;
    },
    [dragProgress, swipe, top],
  );

  useEffect(() => {
    if (!keyboardActive) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") void commit("like");
      if (event.key === "ArrowLeft") void commit("pass");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commit, keyboardActive]);

  if (deck.feed === "loading") {
    return (
      <div className="deck-stage">
        <div className="sheet" role="status">
          <p className="sheet-title">Loading profiles</p>
        </div>
      </div>
    );
  }

  if (deck.feed === "error") {
    return (
      <div className="deck-stage">
        <div className="sheet" role="alert">
          <h2 className="sheet-title">Profiles didn&apos;t load</h2>
          <p className="sheet-text">Check that the server is running, then try again.</p>
          <button type="button" className="button button-paper" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!top) {
    return (
      <div className="deck-stage">
        <div className="sheet">
          <h2 className="sheet-title">That&apos;s everyone for now</h2>
          <p className="sheet-text">You&apos;ve swiped on every profile. Anyone who liked you back is in Matches.</p>
          <button type="button" className="button button-paper" onClick={openMatches}>
            See matches
          </button>
        </div>
      </div>
    );
  }

  const cards = next ? [next, top] : [top];
  const status = deck.pending?.slow ? "Saving your swipe…" : (deck.notice ?? "");

  return (
    <>
      <div className="deck-stage">
        {cards.map((profile) => {
          const isTop = profile.id === top.id;
          return (
            <SwipeCard
              key={profile.id}
              ref={isTop ? topCard : undefined}
              profile={profile}
              isTop={isTop}
              locked={locked}
              onSwipe={(action) => void commit(action)}
              dragProgress={dragProgress}
            />
          );
        })}
      </div>

      <p className="deck-status" role="status">
        {status}
      </p>

      <div className="deck-actions">
        <button
          type="button"
          className="button button-paper"
          disabled={locked}
          aria-label={`Pass on ${top.name}`}
          onClick={() => void commit("pass")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
          Pass
        </button>
        <button
          type="button"
          className="button button-red"
          disabled={locked}
          aria-label={`Like ${top.name}`}
          onClick={() => void commit("like")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-8.5-5.2-8.5-11.4A4.9 4.9 0 0 1 12 6.8a4.9 4.9 0 0 1 8.5 2.8C20.5 15.8 12 21 12 21z" />
          </svg>
          Like
        </button>
      </div>
    </>
  );
}
