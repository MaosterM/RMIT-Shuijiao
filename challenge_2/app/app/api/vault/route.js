// GET: the sealed vault + unlock progress (any logged-in family member).
// POST: planner seals the vault. The body is already encrypted in the planner's browser.
import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../../lib/store";
import { getUser, deny } from "../../../lib/serverAuth";
import { FAMILY } from "../../../lib/family";

export async function GET(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  const db = await readDb();
  return NextResponse.json({ vault: db.vault, unlock: db.unlock, me: user });
}

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  if (user.role !== "planner") return deny(403, "Only the planner can seal the vault");

  const body = await request.json();
  const { plannerCopy, content, files = [], shares, threshold } = body || {};
  if (!plannerCopy || !content?.ct || !Array.isArray(shares)) return deny(400, "Missing sealed fields");
  const db = await readDb();
  // Seal exactly for the heirs the planner named (step 1), with the threshold he chose.
  if (!db.plan) return deny(400, "Please name your heirs first");
  const heirs = db.plan.heirs.filter((h) => FAMILY.heirs.some((f) => f.username === h));
  if (shares.length !== heirs.length || !shares.every((s) => heirs.includes(s.heir))) return deny(400, "One key share per named heir is required");
  if (threshold !== db.plan.threshold || !(threshold >= 1 && threshold <= heirs.length)) return deny(400, "Invalid threshold");
  if (files.some((f) => !f.body?.ct || f.sizeBytes > 5 * 1024 * 1024)) return deny(400, "Invalid file (max 5 MB)");

  db.vault = {
    id: `vault_${Date.now()}`,
    sealedBy: user.username,
    sealedAt: new Date().toISOString(),
    threshold,
    heirs,
    plannerCopy, // TideCloak doEncrypt ciphertext (only the planner can decrypt)
    content, // AES-GCM ciphertext under the vault key
    files, // per-file AES-GCM ciphertext; metadata kept in clear is non-sensitive (doc type, date, uploader)
    shares, // Shamir shares of the vault key, each RSA-encrypted to one heir
  };
  db.unlock = null; // a new seal resets any previous unlock
  await writeDb(db);
  return NextResponse.json({ ok: true, id: db.vault.id });
}
