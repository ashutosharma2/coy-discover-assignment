import { ME_ID } from "@/lib/server/database";
import { getFeed } from "@/lib/server/discover";
import { NO_STORE } from "@/lib/server/http";
import { getDb } from "@/lib/server/store";
import type { FeedResponse } from "@/lib/types";

/** GET /api/feed: profiles the user hasn't swiped on, shuffled. */
export function GET(): Response {
  const body: FeedResponse = { profiles: getFeed(getDb(), ME_ID) };
  return Response.json(body, { headers: NO_STORE });
}
