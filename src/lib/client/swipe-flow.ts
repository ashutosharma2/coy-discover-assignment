import type { SwipeAttempt } from "./api";

/** Wait before each attempt: send at once, then after 0.5 s, then after a further 1.5 s. */
export const RETRY_DELAYS_MS = [0, 500, 1500];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sends a swipe until the server gives a real answer. Repeating the same swipe is safe:
 * if the first attempt was saved, the server returns that attempt's original answer.
 */
export async function submitSwipe(
  send: () => Promise<SwipeAttempt>,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<SwipeAttempt> {
  let result: SwipeAttempt = { kind: "unknown" };
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) await wait(delay);
    result = await send();
    if (result.kind !== "unknown") return result;
  }
  return result;
}
