"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { THEME_COLORS, THEME_KEY, msUntilThemeChange, resolveTheme, type ThemeChoice } from "./theme";

const listeners = new Set<() => void>();
let remembered: ThemeChoice | null = null;

function readChoice(): ThemeChoice {
  if (remembered) return remembered;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    remembered = saved === "day" || saved === "night" ? saved : "auto";
  } catch {
    remembered = "auto";
  }
  return remembered;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Follows the clock unless the viewer has picked day or night, and changes over on time. */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "auto" as ThemeChoice);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const apply = () => {
      const now = new Date();
      const theme = resolveTheme(choice, now);
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
      clearTimeout(timer);
      if (choice === "auto") timer = setTimeout(apply, msUntilThemeChange(now) + 500);
    };
    apply();
    // Timers don't run while a laptop sleeps, so look at the clock again on return.
    document.addEventListener("visibilitychange", apply);
    window.addEventListener("focus", apply);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", apply);
      window.removeEventListener("focus", apply);
    };
  }, [choice]);

  const choose = useCallback((next: ThemeChoice) => {
    remembered = next;
    try {
      if (next === "auto") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing can block storage. The choice still lasts until the page closes.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { choice, choose };
}
