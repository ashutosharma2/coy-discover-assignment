// npm run reset: deletes the local database. The next request creates and seeds a fresh one,
// with new ids and a new random set of profiles who have already liked you.
import { rmSync } from "node:fs";
import path from "node:path";

const file = process.env.COY_DB_PATH ?? path.join(process.cwd(), "data", "coy.db");
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  rmSync(file + suffix, { force: true });
}
console.log(`Deleted ${path.relative(process.cwd(), file)}. The next request seeds a fresh database.`);
