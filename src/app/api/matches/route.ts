import { ME_ID } from "@/lib/server/database";
import { getMatches } from "@/lib/server/discover";
import { NO_STORE } from "@/lib/server/http";
import { getDb } from "@/lib/server/store";
import type { MatchesResponse } from "@/lib/types";

/** GET /api/matches: the user's mutual matches, newest first. */
export function GET(): Response {
  const body: MatchesResponse = { matches: getMatches(getDb(), ME_ID) };
  return Response.json(body, { headers: NO_STORE });
}
