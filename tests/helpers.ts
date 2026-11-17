import type { DatabaseSync } from "node:sqlite";
import { ME_ID, openDatabase } from "@/lib/server/database";
import { seedDatabase } from "@/lib/server/seed";
import type { Rng } from "@/lib/random";

/** mulberry32: a small seeded generator, so every test run sees the same "random" numbers. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new in-memory database, seeded the same way the app seeds its file. */
export function freshDb(seed = 1): DatabaseSync {
  const db = openDatabase(":memory:");
  seedDatabase(db, seededRng(seed));
  return db;
}

/** Tests may read the swipes table directly; the app never sends it anywhere. */
export function likerIds(db: DatabaseSync): string[] {
  return db
    .prepare("SELECT from_id FROM swipes WHERE to_id = ? AND action = 'like'")
    .all(ME_ID)
    .map((row) => String(row.from_id));
}

export function nonLikerIds(db: DatabaseSync): string[] {
  const likers = new Set(likerIds(db));
  return allProfileIds(db).filter((id) => !likers.has(id));
}

export function allProfileIds(db: DatabaseSync): string[] {
  return db
    .prepare("SELECT id FROM profiles WHERE id <> ?")
    .all(ME_ID)
    .map((row) => String(row.id));
}

export function count(db: DatabaseSync, table: "swipes" | "matches"): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}

export const PUBLIC_FIELDS = ["age", "avatarUrl", "bio", "city", "college", "id", "interests", "name"];
