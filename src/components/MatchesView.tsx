"use client";

import { useState } from "react";
import type { MatchesState } from "@/lib/client/use-discover";
import type { MatchedProfile } from "@/lib/types";
import { PostcardSheet } from "./PostcardSheet";
import { StampAvatar } from "./StampAvatar";

interface MatchesViewProps {
  matches: MatchesState;
  retry: () => Promise<void>;
  showDeck: () => void;
}

const matchedOn = (match: MatchedProfile) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long" }).format(new Date(match.matchedAt));

export function MatchesView({ matches, retry, showDeck }: MatchesViewProps) {
  const [reading, setReading] = useState<MatchedProfile | null>(null);

  if (matches.status === "error" && matches.items.length === 0) {
    return (
      <div className="sheet" role="alert">
        <h2 className="sheet-title">Matches didn&apos;t load</h2>
        <p className="sheet-text">Check that the server is running, then try again.</p>
        <button type="button" className="button button-ink" onClick={() => void retry()}>
          Try again
        </button>
      </div>
    );
  }

  if (matches.status === "idle" || matches.status === "loading") {
    return (
      <div className="sheet" role="status">
        <p className="sheet-title">Loading matches</p>
      </div>
    );
  }

  if (matches.items.length === 0) {
    return (
      <div className="sheet">
        <h2 className="sheet-title">No matches yet</h2>
        <p className="sheet-text">When you and someone else both like each other, they appear here.</p>
        <button type="button" className="button button-ink" onClick={showDeck}>
          Keep swiping
        </button>
      </div>
    );
  }

  const count = matches.items.length;

  return (
    <>
      <header className="album-head">
        <h2 className="album-title">Your matches</h2>
        <p className="album-count">
          {count} {count === 1 ? "path" : "paths"} aligned
        </p>
      </header>

      <div className="album-scroll">
        <ul className="album">
          {matches.items.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                className="album-item"
                aria-label={`Read ${match.name}'s postcard. Matched on ${matchedOn(match)}.`}
                onClick={() => setReading(match)}
              >
                <StampAvatar src={match.avatarUrl} name={match.name} />
                <span className="album-name">
                  {match.name}
                  <span className="album-age">{match.age}</span>
                </span>
                <span className="album-place">{match.college ?? match.city}</span>
                <svg className="album-seal" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="12" fill="currentColor" />
                  <path d="M12 18.500s-6-3.700-6-8a3.300 3.300 0 0 1 6-1.900 3.300 3.300 0 0 1 6 1.900c0 4.300-6 8-6 8Z" fill="#fff" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <PostcardSheet profile={reading} note={reading ? `Paths aligned on ${matchedOn(reading)}` : undefined} onClose={() => setReading(null)} />
    </>
  );
}
