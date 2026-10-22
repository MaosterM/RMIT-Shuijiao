// Heir family keys. Each heir's RSA private key is sealed with THEIR OWN TideCloak doEncrypt
// before it leaves the browser, so the server only stores ciphertext + the public key.
import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../../lib/store";
import { getUser, deny } from "../../../lib/serverAuth";

export async function GET(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  const db = await readDb();
  // Public keys are public; the sealed private key is only returned to its owner.
  const keys = Object.fromEntries(
    Object.entries(db.heirKeys).map(([u, k]) => [u, { publicJwk: k.publicJwk, createdAt: k.createdAt, ...(u === user.username ? { sealedPrivateKey: k.sealedPrivateKey } : {}) }])
  );
  return NextResponse.json({ keys, me: user });
}

export async function POST(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  if (user.role !== "heir") return deny(403, "Only heirs need a family key");
  const { publicJwk, sealedPrivateKey } = (await request.json()) || {};
  if (!publicJwk?.n || typeof sealedPrivateKey !== "string") return deny(400, "Missing key");
  const db = await readDb();
  if (db.vault?.heirs?.includes(user.username) && db.heirKeys[user.username]) {
    return deny(409, "Your key is already used by the sealed vault");
  }
  db.heirKeys[user.username] = { publicJwk, sealedPrivateKey, createdAt: new Date().toISOString() };
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
