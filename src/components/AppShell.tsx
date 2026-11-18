"use client";

import { AnimatePresence, useMotionValue } from "motion/react";
import { useCallback, useState } from "react";
import { useDiscover, useMatches } from "@/lib/client/use-discover";
import { MatchesView } from "./MatchesView";
import { MatchScreen } from "./MatchScreen";
import { DiscoverScene } from "./scene/DiscoverScene";
import { SwipeDeck } from "./SwipeDeck";
import { TabBar, type Tab } from "./TabBar";

type View = "deck" | "matches";

/**
 * Holds everything that has to survive moving between tabs. Panels are hidden rather than
 * removed, so a card in the middle of a swipe isn't lost when the user switches away.
 */
export function AppShell() {
  const [tab, setTab] = useState<Tab>("discover");
  const [view, setView] = useState<View>("deck");
  const { deck, swipe, reload, closeMatch } = useDiscover();
  const { matches, load: loadMatches } = useMatches();
  const dragProgress = useMotionValue(0);

  const openMatches = useCallback(() => {
    setView("matches");
    void loadMatches();
  }, [loadMatches]);

  const seeMatchesFromMatchScreen = useCallback(() => {
    closeMatch();
    openMatches();
  }, [closeMatch, openMatches]);

  return (
    <div className="app">
      <main className="app-main" inert={deck.match !== null}>
        <DiscoverScene
          active={tab === "discover" && view === "deck"}
          saving={deck.pending !== null}
          lastSaved={deck.lastSaved}
          matchOpen={deck.match !== null}
          dragProgress={dragProgress}
        />
        {tab === "home" && <h1 className="sr-only">Home</h1>}

        <div className={tab === "discover" ? "discover" : "hidden"}>
          <h1 className="sr-only">Discover</h1>
          <nav className="segments" aria-label="Discover sections">
            <button
              type="button"
              className="segment"
              aria-current={view === "deck" ? "page" : undefined}
              onClick={() => setView("deck")}
            >
              Discover
            </button>
            <button
              type="button"
              className="segment"
              aria-current={view === "matches" ? "page" : undefined}
              onClick={openMatches}
            >
              Matches
            </button>
          </nav>

          <div className={view === "deck" ? "panel" : "hidden"}>
            <SwipeDeck
              deck={deck}
              swipe={swipe}
              reload={reload}
              openMatches={openMatches}
              keyboardActive={tab === "discover" && view === "deck" && deck.match === null}
              dragProgress={dragProgress}
            />
          </div>

          <div className={view === "matches" ? "panel" : "hidden"}>
            <MatchesView matches={matches} retry={loadMatches} showDeck={() => setView("deck")} />
          </div>
        </div>
      </main>

      <div inert={deck.match !== null}>
        <TabBar tab={tab} onChange={setTab} />
      </div>

      <AnimatePresence>
        {deck.match && (
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
