import "server-only";
import type { ErrorResponse } from "../types";

export const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Every error has the same shape, and the message never depends on anyone else's likes. */
export function errorResponse(status: number, message: string): Response {
  const body: ErrorResponse = { success: false, message };
  return Response.json(body, { status, headers: NO_STORE });
}
