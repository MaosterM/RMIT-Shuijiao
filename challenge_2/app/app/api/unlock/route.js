// Quorum unlock. "request" opens an unlock request; "approve" records one heir's approval and
// stores that heir's key share re-encrypted (in their browser) to every heir's public key.
// The server cannot open the vault: it only ever sees RSA-encrypted shares.
import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../../lib/store";
import { getUser, deny } from "../../../lib/serverAuth";

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  if (user.role !== "heir") return deny(403, "Only heirs can request or approve an unlock");

  const db = await readDb();
  if (!db.vault) return deny(404, "There is no sealed vault yet");
  if (!db.vault.heirs.includes(user.username)) return deny(403, "You are not an heir of this vault");

  const { action, released } = (await request.json()) || {};
  const now = new Date().toISOString();

  if (action === "request") {
    if (!db.unlock) db.unlock = { requestedBy: user.username, requestedAt: now, approvals: [], released: [] };
    await writeDb(db);
    return NextResponse.json({ ok: true, unlock: db.unlock });
  }

  if (action === "approve") {
    if (!db.unlock) return deny(400, "Request an unlock first");
    // Distinct authenticated heirs only: identity comes from the verified TideCloak token.
    if (db.unlock.approvals.some((a) => a.heir === user.username)) return deny(409, "You have already approved");
    if (!Array.isArray(released) || released.length !== db.vault.heirs.length) return deny(400, "Missing re-encrypted key shares");
    db.unlock.approvals.push({ heir: user.username, at: now });
    for (const r of released) db.unlock.released.push({ from: user.username, to: r.to, encShare: r.encShare });
    await writeDb(db);
    return NextResponse.json({ ok: true, unlock: db.unlock });
  }

  return deny(400, "Unknown action");
}
