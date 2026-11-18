"use client";

import { useTheme } from "@/lib/client/use-theme";
import type { ThemeChoice } from "@/lib/client/theme";

const NEXT: Record<ThemeChoice, ThemeChoice> = { auto: "day", day: "night", night: "auto" };

const LABELS: Record<ThemeChoice, string> = {
  auto: "Appearance follows the clock. Switch to day.",
  day: "Appearance is set to day. Switch to night.",
  night: "Appearance is set to night. Switch to following the clock.",
};

function Icon({ choice }: { choice: ThemeChoice }) {
  if (choice === "day") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600 7 7M17 17l1.400 1.400M18.400 5.600 17 7M7 17l-1.400 1.400" />
      </svg>
    );
  }
  if (choice === "night") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.500" />
      <path d="M12 3.500a8.500 8.500 0 0 1 0 17Z" fill="currentColor" />
    </svg>
  );
}

/** A small switch between following the clock, always day and always night. */
export function ThemeControl() {
  const { choice, choose } = useTheme();
  return (
    <button type="button" className="round-control" aria-label={LABELS[choice]} title={LABELS[choice]} onClick={() => choose(NEXT[choice])}>
      <Icon choice={choice} />
    </button>
  );
}
