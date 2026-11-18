import type {
  FeedResponse,
  MatchedProfile,
  MatchesResponse,
  PublicProfile,
  SwipeRequest,
  SwipeResponse,
} from "../types";

export const SWIPE_TIMEOUT_MS = 8000;

/**
 * What one attempt at POST /api/swipe tells the browser.
 * "unknown" means no usable answer came back, so the swipe may or may not have been saved.
 */
export type SwipeAttempt =
  | { kind: "ok"; matched: boolean }
  | { kind: "conflict" }
  | { kind: "not_found" }
  | { kind: "rejected" }
  | { kind: "unknown" };

export async function sendSwipe(swipe: SwipeRequest, fetchFn: typeof fetch = fetch): Promise<SwipeAttempt> {
  try {
    const response = await fetchFn("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(swipe),
      signal: AbortSignal.timeout(SWIPE_TIMEOUT_MS),
    });
    if (response.ok) {
      const body = (await response.json()) as SwipeResponse;
      return { kind: "ok", matched: body.matched === true };
    }
    if (response.status === 409) return { kind: "conflict" };
    if (response.status === 404) return { kind: "not_found" };
    if (response.status >= 500) return { kind: "unknown" };
    return { kind: "rejected" };
  } catch {
    return { kind: "unknown" };
  }
}

/** Asks the server to clear the user's swipes and matches. False means it may not have happened. */
export async function resetDeck(fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetchFn("/api/reset", { method: "POST", signal: AbortSignal.timeout(SWIPE_TIMEOUT_MS) });
    return response.ok;
  } catch {
    return false;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchFeed(): Promise<PublicProfile[]> {
  return (await getJson<FeedResponse>("/api/feed")).profiles;
}

export async function fetchMatches(): Promise<MatchedProfile[]> {
  return (await getJson<MatchesResponse>("/api/matches")).matches;
}
