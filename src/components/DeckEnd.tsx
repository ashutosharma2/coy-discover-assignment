"use client";

import { useEffect, useRef, useState, type Ref } from "react";

interface DeckEndProps {
  onSeeMatches: () => void;
  /** Resolves to false if the server couldn't start over. */
  onStartOver: () => Promise<boolean>;
  seeMatchesRef: Ref<HTMLButtonElement>;
}

type Step = "read" | "confirm" | "working" | "failed";

function DeskClear() {
  return (
    <svg className="sheet-art" viewBox="0 0 150 96" aria-hidden="true">
      <g stroke="#18120f" strokeWidth="2.400" strokeLinejoin="round">
        <rect x="24" y="30" width="70" height="46" rx="4" fill="#c9b6e4" transform="rotate(-11 59 53)" />
        <rect x="56" y="30" width="70" height="46" rx="4" fill="#9cc5a1" transform="rotate(10 91 53)" />
        <rect x="38" y="24" width="74" height="50" rx="4" fill="#fffdf8" />
        <rect x="90" y="31" width="15" height="18" fill="#ffe3dc" strokeWidth="1.600" />
      </g>
      <path d="M48 40h30M48 50h30M48 60h20" stroke="#18205f" strokeWidth="2.400" strokeLinecap="round" opacity="0.5" />
      <path d="M126 8l3 9 9 3-9 3-3 9-3-9-9-3 9-3zM20 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#f2c14e" stroke="#18120f" strokeWidth="1.600" strokeLinejoin="round" />
    </svg>
  );
}

/** The last screen of the deck. Starting over erases matches, so it asks first. */
export function DeckEnd({ onSeeMatches, onStartOver, seeMatchesRef }: DeckEndProps) {
  const [step, setStep] = useState<Step>("read");
  const keepButton = useRef<HTMLButtonElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (step === "confirm") keepButton.current?.focus();
    if (step === "read" && cancelled.current) {
      cancelled.current = false;
      startButton.current?.focus();
    }
  }, [step]);

  async function confirm() {
    if (step === "working") return;
    setStep("working");
    if (!(await onStartOver())) setStep("failed");
  }

  if (step === "read") {
    return (
      <div className="sheet">
        <DeskClear />
        <h2 className="sheet-title">Every postcard read</h2>
        <p className="sheet-text">Anyone who liked you back is waiting in Matches.</p>
        <div className="sheet-actions">
          <button ref={seeMatchesRef} type="button" className="button button-ink" onClick={onSeeMatches}>
            See matches
          </button>
          <button ref={startButton} type="button" className="button button-quiet" onClick={() => setStep("confirm")}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  const working = step === "working";
  return (
    <div className="sheet">
      <h2 className="sheet-title">Start over?</h2>
      <p className="sheet-text">This clears your swipes and matches, then brings every postcard back.</p>
      {step === "failed" && (
        <p className="sheet-error" role="alert">
          That didn&apos;t work. Check that the server is running, then try again.
        </p>
      )}
      <div className="sheet-actions">
        <button type="button" className="button button-ink" aria-disabled={working} onClick={() => void confirm()}>
          {working ? "Starting over…" : "Start over"}
        </button>
        <button
          ref={keepButton}
          type="button"
          className="button button-quiet"
          disabled={working}
          onClick={() => {
            cancelled.current = true;
            setStep("read");
          }}
        >
          Keep my matches
        </button>
      </div>
    </div>
  );
}
