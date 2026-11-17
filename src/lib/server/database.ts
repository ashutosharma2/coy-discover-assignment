import "server-only";
import { DatabaseSync } from "node:sqlite";

/** The one logged-in user. The brief has no auth, so the server decides who "me" is. */
export const ME_ID = "me";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  age        INTEGER NOT NULL CHECK (age >= 18),
  city       TEXT NOT NULL,
  college    TEXT,
  bio        TEXT NOT NULL,
  interests  TEXT NOT NULL,          -- JSON array of strings
  avatar_url TEXT NOT NULL
);

-- One swipe per pair, ever: the primary key refuses a second row for (from_id, to_id).
CREATE TABLE IF NOT EXISTS swipes (
  from_id    TEXT NOT NULL REFERENCES profiles (id),
  to_id      TEXT NOT NULL REFERENCES profiles (id),
  action     TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  CHECK (from_id <> to_id)
);

-- One match per pair: ids are stored in sorted order, so (a, b) and (b, a) are the same row.
CREATE TABLE IF NOT EXISTS matches (
  user_a     TEXT NOT NULL REFERENCES profiles (id),
  user_b     TEXT NOT NULL REFERENCES profiles (id),
  matched_at TEXT NOT NULL,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
`;

/** Opens (or creates) a database file, or ":memory:" in tests, and makes sure the tables exist. */
export function openDatabase(filename: string): DatabaseSync {
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  return db;
}
