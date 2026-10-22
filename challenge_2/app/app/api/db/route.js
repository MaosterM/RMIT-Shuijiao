// Raw database dump for the "Database View": exactly what an admin, the host or an attacker who
// stole data/db.json would see.
import { NextResponse } from "next/server";
import { readDb } from "../../../lib/store";
import { getUser, deny } from "../../../lib/serverAuth";

export async function GET(request) {
  const user = await getUser(request);
  if (!user) return deny(401, "Please log in");
  return NextResponse.json(await readDb());
}
