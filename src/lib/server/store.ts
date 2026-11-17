import "server-only";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "./database";
import { seedDatabase } from "./seed";

function databasePath(): string {
  return process.env.COY_DB_PATH ?? path.join(process.cwd(), "data", "coy.db");
}

// One connection per server process, kept on globalThis so dev-server reloads reuse it.
const holder = globalThis as typeof globalThis & {
  coyDb?: { db: DatabaseSync; file: string };
};

/**
 * Returns the app's database, creating and seeding it on first use. If the file has been
 * deleted (`npm run reset`), it opens a fresh one instead of writing to the deleted file.
 */
export function getDb(): DatabaseSync {
  const file = databasePath();
  const current = holder.coyDb;
  // The database is created at runtime, so the build has nothing to trace at this path.
  if (current && current.file === file && existsSync(/*turbopackIgnore: true*/ file)) return current.db;

  current?.db.close();
  mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const db = openDatabase(file);

  const row = db.prepare("SELECT COUNT(*) AS count FROM profiles").get();
  if (Number(row?.count) === 0) {
    const seeded = seedDatabase(db);
    console.log(`Seeded ${seeded.profiles} profiles; ${seeded.likers} of them have already liked you.`);
  }

  holder.coyDb = { db, file };
  return db;
}
