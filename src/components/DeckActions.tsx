import type { SwipeAction } from "@/lib/types";

interface DeckActionsProps {
  name: string;
  /** While a swipe is saving the buttons stay focusable, so keyboard users keep their place. */
  waiting: boolean;
  /** Changes each time the server confirms a like, which sets off the burst of hearts. */
  likeSaved: number;
  onSwipe: (action: SwipeAction) => void;
}

const BURST = [
  [-46, -58, -24], [-14, -82, 10], [24, -70, 22], [56, -40, 34], [-64, -22, -38], [40, -92, -12], [-34, -96, 18], [70, -74, 28],
];

function HeartBurst() {
  return (
    <span className="heart-burst" aria-hidden="true">
      {BURST.map(([x, y, turn], i) => (
        <svg
          key={`${x}-${y}`}
          viewBox="0 0 24 24"
          className="burst-heart"
          style={{ "--x": `${x}px`, "--y": `${y}px`, "--turn": `${turn}deg`, animationDelay: `${i * 18}ms` } as React.CSSProperties}
        >
          <path d="M12 21s-8.500-5.200-8.500-11.400A4.900 4.900 0 0 1 12 6.800a4.900 4.900 0 0 1 8.500 2.800C20.500 15.800 12 21 12 21z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

export function DeckActions({ name, waiting, likeSaved, onSwipe }: DeckActionsProps) {
  function press(action: SwipeAction) {
    if (waiting) return;
    // A short buzz on phones that support it.
    navigator.vibrate?.(action === "like" ? 14 : 8);
    onSwipe(action);
  }

  return (
    <div className="deck-actions">
      <button
        type="button"
        className="action action-pass"
        aria-disabled={waiting}
        aria-label={`Pass on ${name}`}
        aria-keyshortcuts="ArrowLeft"
        onClick={() => press("pass")}
      >
        <span className="action-orb">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3.200" strokeLinecap="round" aria-hidden="true">
            <path d="M6.500 6.500l11 11M17.500 6.500l-11 11" />
          </svg>
        </span>
        <span className="action-label">Pass</span>
        <kbd className="action-key" aria-hidden="true">←</kbd>
      </button>

      <button
        type="button"
        className="action action-like"
        aria-disabled={waiting}
        aria-label={`Like ${name}`}
        aria-keyshortcuts="ArrowRight"
        onClick={() => press("like")}
      >
        <span className="action-orb">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-8.500-5.200-8.500-11.400A4.900 4.900 0 0 1 12 6.800a4.900 4.900 0 0 1 8.500 2.800C20.500 15.800 12 21 12 21z" />
          </svg>
        </span>
        <span className="action-label">Like</span>
        <kbd className="action-key" aria-hidden="true">→</kbd>
        {likeSaved > 0 && <HeartBurst key={likeSaved} />}
      </button>
    </div>
  );
}
