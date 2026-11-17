import { ME_ID } from "@/lib/server/database";
import { recordSwipe } from "@/lib/server/discover";
import { errorResponse, NO_STORE } from "@/lib/server/http";
import { getDb } from "@/lib/server/store";
import type { SwipeRequest, SwipeResponse } from "@/lib/types";

function parseSwipeRequest(body: unknown): SwipeRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { profileId, action } = body as Record<string, unknown>;
  if (typeof profileId !== "string" || profileId.length === 0) return null;
  if (action !== "like" && action !== "pass") return null;
  return { profileId, action };
}

/**
 * POST /api/swipe { profileId, action }: records a like or pass and says whether it made a match.
 * The user is always the server's logged-in user; the body can't name who is swiping.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "The request body must be JSON.");
  }

  const swipe = parseSwipeRequest(body);
  if (!swipe) return errorResponse(400, 'Send { "profileId": string, "action": "like" | "pass" }.');

  const outcome = recordSwipe(getDb(), ME_ID, swipe.profileId, swipe.action);
  switch (outcome.kind) {
    case "ok": {
      const result: SwipeResponse = { matched: outcome.matched };
      return Response.json(result, { headers: NO_STORE });
    }
    case "conflict":
      return errorResponse(409, "A different swipe has already been recorded.");
    case "not_found":
      return errorResponse(404, "Profile not found.");
  }
}
