// The planner names who will hold the keys (heirs) and how many must agree (threshold).
// Heirs see this on their Family Vault page and set up their family key in response.
import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../../lib/store";
import { getUser, deny } from "../../../lib/serverAuth";
import { FAMILY } from "../../../lib/family";

export async function GET(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  const db = await readDb();
  return NextResponse.json({ plan: db.plan, me: user });
}

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  if (user.role !== "planner") return deny(403, "Only the planner can name heirs");
  const { heirs, threshold } = (await request.json()) || {};
  const known = FAMILY.heirs.map((h) => h.username);
  if (!Array.isArray(heirs) || heirs.length < 1 || new Set(heirs).size !== heirs.length || !heirs.every((h) => known.includes(h))) {
    return deny(400, "Please choose at least one heir from the family list");
  }
  if (!(Number.isInteger(threshold) && threshold >= 1 && threshold <= heirs.length)) return deny(400, "Invalid number of approvals");
  const db = await readDb();
  db.plan = { heirs, threshold, namedBy: user.username, namedAt: new Date().toISOString() };
  await writeDb(db);
  return NextResponse.json({ ok: true, plan: db.plan });
}
