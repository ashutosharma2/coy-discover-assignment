import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { shuffle, type Rng } from "../random";
import { ME_ID } from "./database";
import { SEED_PROFILES } from "./seed-profiles";

/** How many seeded profiles have already liked the user, so a demo can produce matches. */
export const LIKER_COUNT = 8;

export interface SeedSummary {
  profiles: number;
  likers: number;
}

/**
 * Fills an empty database: the user, the seeded profiles with random UUIDs, and likes from
 * LIKER_COUNT of them, picked at random. Ids and likers both change on every seed, so
 * neither a profile's id nor its place in the seed file says whether it liked you.
 */
export function seedDatabase(db: DatabaseSync, rng: Rng = Math.random, now: Date = new Date()): SeedSummary {
  const insertProfile = db.prepare(
    `INSERT INTO profiles (id, name, age, city, college, bio, interests, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertLike = db.prepare(
    `INSERT INTO swipes (from_id, to_id, action, created_at) VALUES (?, ?, 'like', ?)`,
  );

  db.exec("BEGIN");
  try {
    insertProfile.run(ME_ID, "You", 21, "Delhi", null, "", "[]", "/avatars/you.svg");

    const ids = SEED_PROFILES.map((p) => {
      const id = randomUUID();
      insertProfile.run(
        id,
        p.name,
        p.age,
        p.city,
        p.college,
        p.bio,
        JSON.stringify(p.interests),
        `/avatars/${p.name.toLowerCase()}.svg`,
      );
      return id;
    });

    const likers = shuffle(ids, rng).slice(0, LIKER_COUNT);
    const at = now.toISOString();
    for (const id of likers) insertLike.run(id, ME_ID, at);

    db.exec("COMMIT");
    return { profiles: ids.length, likers: likers.length };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
