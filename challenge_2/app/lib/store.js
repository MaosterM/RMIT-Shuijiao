// Server-side storage: one local JSON file (data/db.json). It only ever holds ciphertext plus
// non-sensitive metadata, so reading this file (as an admin, host or attacker) reveals nothing.
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const EMPTY = { plan: null, vault: null, heirKeys: {}, unlock: null };

export async function readDb() {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(DB_PATH, "utf8")) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export async function writeDb(db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = DB_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_PATH);
}
