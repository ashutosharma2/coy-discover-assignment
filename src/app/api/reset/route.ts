import { errorResponse, NO_STORE } from "@/lib/server/http";
import { startOver } from "@/lib/server/seed";
import { getDb } from "@/lib/server/store";
import type { ResetResponse } from "@/lib/types";

/**
 * POST /api/reset: clears the user's swipes and matches so the demo can be played again.
 * It is the one request that erases data, so only this app's own pages may send it.
 */
export function POST(request: Request): Response {
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return errorResponse(403, "Start over from the app.");

  startOver(getDb());
  const result: ResetResponse = { success: true };
  return Response.json(result, { headers: NO_STORE });
}
