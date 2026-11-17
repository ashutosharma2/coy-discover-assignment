import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { shuffle, type Rng } from "../random";
import type { MatchedProfile, PublicProfile, SwipeAction } from "../types";

type Row = Record<string, unknown>;

/**
 * The allowlist: the only place a database row becomes something the browser sees.
 * Rows are never passed through as they are, so a column added later can't leak.
 */
function toPublicProfile(row: Row): PublicProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    age: Number(row.age),
    city: String(row.city),
    college: row.college === null ? null : String(row.college),
    bio: String(row.bio),
    interests: JSON.parse(String(row.interests)) as string[],
    avatarUrl: String(row.avatar_url),
  };
}

const PROFILE_COLUMNS = "p.id, p.name, p.age, p.city, p.college, p.bio, p.interests, p.avatar_url";

/**
 * Profiles the user hasn't swiped on, in a fresh random order on every call.
 * The query only reads the user's own swipes (from_id = user), never anyone's likes of the user.
 */
export function getFeed(db: DatabaseSync, userId: string, rng: Rng = Math.random): PublicProfile[] {
  const rows = db
    .prepare(
      `SELECT ${PROFILE_COLUMNS}
       FROM profiles p
       WHERE p.id <> ?
         AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.from_id = ? AND s.to_id = p.id)`,
    )
    .all(userId, userId);
  return shuffle(rows.map(toPublicProfile), rng);
}

export type SwipeOutcome =
  | { kind: "ok"; matched: boolean }
  | { kind: "conflict" }
  | { kind: "not_found" };

/**
 * Records a like or pass. Swipes are final:
 * - the same swipe again (a double tap) gets the original answer back;
 * - a different swipe on the same profile is a conflict.
 * A like makes a match only if the other profile already liked the user.
 */
export function recordSwipe(
  db: DatabaseSync,
  userId: string,
  profileId: string,
  action: SwipeAction,
  now: Date = new Date(),
): SwipeOutcome {
  if (profileId === userId) return { kind: "not_found" };
  if (!db.prepare("SELECT 1 FROM profiles WHERE id = ?").get(profileId)) return { kind: "not_found" };

  // BEGIN IMMEDIATE takes SQLite's write lock before the check, so no other writer can get
  // between "has this pair been swiped?" and the insert. The (from_id, to_id) primary key
  // is the backstop if that ever fails.
  db.exec("BEGIN IMMEDIATE");
  try {
    const outcome = swipeInTransaction(db, userId, profileId, action, now.toISOString());
    db.exec("COMMIT");
    return outcome;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function swipeInTransaction(
  db: DatabaseSync,
  userId: string,
  profileId: string,
  action: SwipeAction,
  at: string,
): SwipeOutcome {
  const previous = db
    .prepare("SELECT action FROM swipes WHERE from_id = ? AND to_id = ?")
    .get(userId, profileId);

  if (previous) {
    if (previous.action !== action) return { kind: "conflict" };
    return { kind: "ok", matched: action === "like" && hasMatch(db, userId, profileId) };
  }

  db.prepare("INSERT INTO swipes (from_id, to_id, action, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    profileId,
    action,
    at,
  );
  if (action === "pass") return { kind: "ok", matched: false };

  const likedBack = db
    .prepare("SELECT 1 FROM swipes WHERE from_id = ? AND to_id = ? AND action = 'like'")
    .get(profileId, userId);
  if (!likedBack) return { kind: "ok", matched: false };

  // matched_at is the time of this like, the one that completed the match. The other
  // person's earlier like time is never stored on the match, so it can't reveal when they liked you.
  const [a, b] = [userId, profileId].sort();
  db.prepare("INSERT INTO matches (user_a, user_b, matched_at) VALUES (?, ?, ?)").run(a, b, at);
  return { kind: "ok", matched: true };
}

function hasMatch(db: DatabaseSync, userId: string, profileId: string): boolean {
  const [a, b] = [userId, profileId].sort();
  return Boolean(db.prepare("SELECT 1 FROM matches WHERE user_a = ? AND user_b = ?").get(a, b));
}

/** Mutual matches only, newest first. */
export function getMatches(db: DatabaseSync, userId: string): MatchedProfile[] {
  const rows = db
    .prepare(
      `SELECT ${PROFILE_COLUMNS}, m.matched_at
       FROM matches m
       JOIN profiles p ON p.id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END
       WHERE m.user_a = ? OR m.user_b = ?
       ORDER BY m.matched_at DESC, p.name`,
    )
    .all(userId, userId, userId);
  return rows.map((row) => ({ ...toPublicProfile(row), matchedAt: String(row.matched_at) }));
}
