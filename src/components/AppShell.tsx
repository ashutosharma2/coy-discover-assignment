"use client";

import { AnimatePresence, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MATCH_SCENE_MS } from "@/lib/client/mascot";
import { useDiscover, useMatches } from "@/lib/client/use-discover";
import { MatchesView } from "./MatchesView";
import { MatchScreen } from "./MatchScreen";
import { DiscoverScene } from "./scene/DiscoverScene";
import { SwipeDeck } from "./SwipeDeck";
import { TabBar, type Tab } from "./TabBar";
import { ThemeControl } from "./ThemeControl";

type View = "deck" | "matches";

/**
 * Holds everything that has to survive moving between tabs. Panels are hidden rather than
 * removed, so a card in the middle of a swipe isn't lost when the user switches away.
 */
export function AppShell() {
  const [tab, setTab] = useState<Tab>("discover");
  const [view, setView] = useState<View>("deck");
  const [filterSlot, setFilterSlot] = useState<HTMLDivElement | null>(null);
  const { deck, swipe, reload, closeMatch, markMatchesSeen, startOver } = useDiscover();
  const { matches, load: loadMatches } = useMatches();
  const dragProgress = useMotionValue(0);
  const reduceMotion = useReducedMotion() ?? false;
  const [revealedMatch, setRevealedMatch] = useState<string | null>(null);

  // A confirmed match plays out in the room first, then the match screen opens.
  // The key includes the reset count, because someone can match again after starting over.
  const matchId = deck.match?.id ?? null;
  const matchKey = matchId ? `${deck.resets}:${matchId}` : null;
  const justMatched = deck.lastSaved?.matched ?? false;
  useEffect(() => {
    if (!matchKey) return;
    const board = document.querySelector(".scene-board");
    const boardIsShowing = board !== null && getComputedStyle(board).display !== "none";
    const delay = justMatched && boardIsShowing && !reduceMotion ? MATCH_SCENE_MS : 0;
    const timer = setTimeout(() => setRevealedMatch(matchKey), delay);
    return () => clearTimeout(timer);
  }, [justMatched, matchKey, reduceMotion]);
  const showMatchScreen = matchKey !== null && revealedMatch === matchKey;

  // The app behind the match screen can't hold focus, so give it back when the screen closes.
  const matchWasOpen = useRef(false);
  useEffect(() => {
    if (matchWasOpen.current && !matchId) {
      const next = view === "deck" ? ".action-like" : '.segment[aria-current="page"]';
      document.querySelector<HTMLElement>(next)?.focus();
    }
    matchWasOpen.current = matchId !== null;
  }, [matchId, view]);

  const openMatches = useCallback(() => {
    setView("matches");
    markMatchesSeen();
    void loadMatches();
  }, [loadMatches, markMatchesSeen]);

  const seeMatchesFromMatchScreen = useCallback(() => {
    closeMatch();
    openMatches();
  }, [closeMatch, openMatches]);

  const startOverAndRefresh = useCallback(async () => {
    const done = await startOver();
    if (done) void loadMatches();
    return done;
  }, [loadMatches, startOver]);

  return (
    <div className="app">
      <main className="app-main" inert={deck.match !== null} data-match-beat={deck.match !== null && !showMatchScreen}>
        <DiscoverScene
          active={tab === "discover" && view === "deck"}
          saving={deck.pending !== null}
          lastSaved={deck.lastSaved}
          returned={deck.returned}
          resets={deck.resets}
          matchOpen={deck.match !== null}
          dragProgress={dragProgress}
        />
        {tab === "home" && <h1 className="sr-only">Home</h1>}

        <div className={tab === "discover" ? "discover" : "hidden"}>
          <h1 className="sr-only">Discover</h1>
          <div className="topbar">
            <nav className="segments" aria-label="Discover sections">
              <button
                type="button"
                className="segment"
                aria-current={view === "deck" ? "page" : undefined}
                onClick={() => setView("deck")}
              >
                Postcards
              </button>
              <button
                type="button"
                className="segment"
                aria-current={view === "matches" ? "page" : undefined}
                onClick={openMatches}
              >
                Matches
                {deck.newMatches > 0 && (
                  <span className="segment-badge">
                    <span className="sr-only">, new: </span>
                    {deck.newMatches}
                  </span>
                )}
              </button>
            </nav>
            <div ref={setFilterSlot} className="topbar-slot" />
            <ThemeControl />
          </div>

          <div className={view === "deck" ? "panel" : "hidden"}>
            <SwipeDeck
              deck={deck}
              swipe={swipe}
              reload={reload}
              startOver={startOverAndRefresh}
              openMatches={openMatches}
              keyboardActive={tab === "discover" && view === "deck" && deck.match === null}
              dragProgress={dragProgress}
              filterSlot={filterSlot}
              showFilter={view === "deck"}
            />
          </div>

          <div className={view === "matches" ? "panel panel-album" : "hidden"}>
            <MatchesView matches={matches} retry={loadMatches} showDeck={() => setView("deck")} />
          </div>
        </div>
      </main>

      <div inert={deck.match !== null}>
        <TabBar tab={tab} onChange={setTab} />
      </div>

      <AnimatePresence>
        {deck.match && showMatchScreen && (
          <MatchScreen
            key={deck.match.id}
            profile={deck.match}
            onKeepSwiping={closeMatch}
            onSeeMatches={seeMatchesFromMatchScreen}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
