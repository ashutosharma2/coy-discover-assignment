"use client";

import { animate, type MotionValue } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DeckState } from "@/lib/client/deck";
import { NO_FILTERS, countFilters, filterProfiles, type DeckFilters } from "@/lib/client/filters";
import type { SwipeResolution } from "@/lib/client/use-discover";
import type { PublicProfile, SwipeAction } from "@/lib/types";
import { DeckActions } from "./DeckActions";
import { DeckEnd } from "./DeckEnd";
import { FilterSheet } from "./FilterSheet";
import { PostcardSheet } from "./PostcardSheet";
import { SwipeCard, type SwipeCardHandle } from "./SwipeCard";

interface SwipeDeckProps {
  deck: DeckState;
  swipe: (profile: PublicProfile, action: SwipeAction, flown: Promise<void>) => Promise<SwipeResolution>;
  reload: () => Promise<void>;
  startOver: () => Promise<boolean>;
  openMatches: () => void;
  keyboardActive: boolean;
  dragProgress: MotionValue<number>;
  /** The place in the top bar where the filter button goes. */
  filterSlot: HTMLElement | null;
  showFilter: boolean;
}

const CARDS_IN_STACK = 3;

function heading(deck: DeckState, showing: number, filtered: boolean) {
  if (deck.feed === "loading") return { title: "Someone new, perhaps?", long: "Sorting the post", short: "" };
  if (deck.feed === "error") return { title: "Someone new, perhaps?", long: "The post is running late", short: "" };
  if (deck.profiles.length === 0) return { title: "You're all caught up", long: "The desk is clear for now", short: "" };
  const one = showing === 1;
  const cards = `${showing} ${one ? "postcard" : "postcards"}`;
  return filtered
    ? { title: "Someone new, perhaps?", long: `${cards} ${one ? "fits" : "fit"} your filters`, short: `${showing} ${one ? "fits" : "fit"}` }
    : { title: "Someone new, perhaps?", long: `${cards} on the desk`, short: `${showing} left` };
}

export function SwipeDeck({ deck, swipe, reload, startOver, openMatches, keyboardActive, dragProgress, filterSlot, showFilter }: SwipeDeckProps) {
  const topCard = useRef<SwipeCardHandle>(null);
  const endButton = useRef<HTMLButtonElement>(null);
  const focusLikeNext = useRef(false);
  const busy = useRef(false);
  const [filters, setFilters] = useState<DeckFilters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reading, setReading] = useState<PublicProfile | null>(null);

  const showing = useMemo(() => filterProfiles(deck.profiles, filters), [deck.profiles, filters]);
  const top = showing.at(0);
  const locked = deck.pending !== null;
  const activeFilters = countFilters(filters);

  const commit = useCallback(
    async (action: SwipeAction, speed?: { x: number; y: number }) => {
      // Only one swipe can be in progress. The next waits for the server's answer.
      if (!top || busy.current) return;
      busy.current = true;
      const flown = topCard.current?.fly(action, speed) ?? Promise.resolve();
      const resolution = await swipe(top, action, flown);
      if (resolution === "returned") topCard.current?.comeBack();
      void animate(dragProgress, 0, { duration: 0.3 });
      busy.current = false;
    },
    [dragProgress, swipe, top],
  );

  const sheetOpen = filtersOpen || reading !== null;
  useEffect(() => {
    if (!keyboardActive || sheetOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;
      if (event.key === "ArrowRight") void commit("like");
      if (event.key === "ArrowLeft") void commit("pass");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commit, keyboardActive, sheetOpen]);

  // When the last card goes, the Like and Pass buttons go too, so focus moves to what replaced them.
  const deckRanOut = deck.feed === "ready" && !top && deck.lastSaved !== null;
  useEffect(() => {
    if (deckRanOut && keyboardActive && document.activeElement === document.body) endButton.current?.focus();
  }, [deckRanOut, keyboardActive]);

  const startOverFromEnd = useCallback(async () => {
    const done = await startOver();
    if (done) {
      setFilters(NO_FILTERS);
      focusLikeNext.current = true;
    }
    return done;
  }, [startOver]);

  useEffect(() => {
    if (!focusLikeNext.current || !top) return;
    focusLikeNext.current = false;
    document.querySelector<HTMLElement>(".action-like")?.focus();
  }, [top]);

  // Drawn back to front, so the active card ends up on top.
  const stackSize = Math.min(CARDS_IN_STACK, showing.length);
  const depths = Array.from({ length: stackSize }, (_, i) => stackSize - 1 - i);
  const status = deck.pending?.slow ? "Saving your swipe…" : (deck.notice ?? "");
  const likeSaved = deck.lastSaved?.action === "like" ? deck.lastSaved.seq : 0;
  const { title, long, short } = heading(deck, showing.length, activeFilters > 0);
  const canFilter = deck.feed === "ready" && deck.profiles.length > 0;

  return (
    <>
      {filterSlot &&
        showFilter &&
        canFilter &&
        createPortal(
          <button type="button" className="filter-button" aria-haspopup="dialog" disabled={locked} onClick={() => setFiltersOpen(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
              <circle cx="16" cy="7" r="2.600" />
              <circle cx="8" cy="17" r="2.600" />
            </svg>
            <span className="filter-button-label">Filters</span>
            {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
          </button>,
          filterSlot,
        )}

      <header className="deck-head">
        <h2 className="deck-title">{title}</h2>
        <p className="deck-subtitle">
          <span className="deck-subtitle-long">{long}</span>
          <span className="deck-subtitle-short">{short}</span>
        </p>
      </header>

      <div className="deck-stage">
        {deck.feed === "loading" && (
          <div className="deck-skeleton" role="status" aria-label="Loading profiles">
            <div className="skeleton-card skeleton-card-back" />
            <div className="skeleton-card">
              <div className="skeleton-photo" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line-short" />
            </div>
          </div>
        )}

        {deck.feed === "error" && (
          <div className="sheet" role="alert">
            <h2 className="sheet-title">Profiles didn&apos;t load</h2>
            <p className="sheet-text">Check that the server is running, then try again.</p>
            <button type="button" className="button button-ink" onClick={() => void reload()}>
              Try again
            </button>
          </div>
        )}

        {deck.feed === "ready" && deck.profiles.length === 0 && (
          <DeckEnd onSeeMatches={openMatches} onStartOver={startOverFromEnd} seeMatchesRef={endButton} />
        )}

        {deck.feed === "ready" && deck.profiles.length > 0 && !top && (
          <div className="sheet">
            <h2 className="sheet-title">No one fits these filters</h2>
            <p className="sheet-text">Clear them to see everyone left on the desk.</p>
            <button ref={endButton} type="button" className="button button-ink" onClick={() => setFilters(NO_FILTERS)}>
              Clear filters
            </button>
          </div>
        )}

        {deck.feed === "ready" &&
          depths.map((depth) => {
            const profile = showing[depth];
            return (
              <SwipeCard
                key={profile.id}
                ref={depth === 0 ? topCard : undefined}
                profile={profile}
                depth={depth}
                locked={locked}
                onSwipe={(action, speed) => void commit(action, speed)}
                onRead={() => setReading(profile)}
                dragProgress={dragProgress}
              />
            );
          })}

        <p className="deck-status" role="status">
          {status}
        </p>
      </div>

      {deck.feed === "ready" && top && (
        <DeckActions name={top.name} waiting={locked} likeSaved={likeSaved} onSwipe={(action) => void commit(action)} />
      )}

      <FilterSheet
        open={filtersOpen}
        profiles={deck.profiles}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />
      <PostcardSheet profile={reading} onClose={() => setReading(null)} />
    </>
  );
}
