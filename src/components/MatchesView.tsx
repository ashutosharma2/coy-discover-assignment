"use client";

import type { MatchesState } from "@/lib/client/use-discover";
import { Postmark, postmarkDate } from "./Postmark";
import { StampAvatar } from "./StampAvatar";

interface MatchesViewProps {
  matches: MatchesState;
  retry: () => Promise<void>;
  showDeck: () => void;
}

export function MatchesView({ matches, retry, showDeck }: MatchesViewProps) {
  if (matches.status === "error" && matches.items.length === 0) {
    return (
      <div className="sheet" role="alert">
        <h2 className="sheet-title">Matches didn&apos;t load</h2>
        <p className="sheet-text">Check that the server is running, then try again.</p>
        <button type="button" className="button button-paper" onClick={() => void retry()}>
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
        <button type="button" className="button button-paper" onClick={showDeck}>
          Keep swiping
        </button>
      </div>
    );
  }

  return (
    <div className="album-scroll">
      <ul className="album">
        {matches.items.map((match) => (
          <li key={match.id} className="album-item">
            <StampAvatar src={match.avatarUrl} name={match.name} />
            <Postmark
              className="album-mark"
              label="MATCH"
              city={match.city}
              date={postmarkDate(new Date(match.matchedAt))}
            />
            <h2 className="album-name">
              {match.name}
              <span className="album-age">{match.age}</span>
            </h2>
            <p className="album-place">{match.college ? `${match.college}, ${match.city}` : match.city}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
