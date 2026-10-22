// Every API call must carry a TideCloak access token; we verify it server-side with the official
// SDK and derive the caller's identity from it (never from the request body).
import { NextResponse } from "next/server";
import { verifyTideCloakToken } from "@tidecloak/nextjs/server";
import tcConfig from "../tidecloak.json";
import { roleOf } from "./family";

export async function getUser(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  // OFFLINE DEMO MODE only (TideCloak not provisioned): SIMULATED identity from a "mock.<username>" token.
  if (!tcConfig?.realm) {
    const t = auth.slice(7);
    if (!t.startsWith("mock.")) return null;
    const username = t.slice(5).toLowerCase();
    return { username, role: roleOf(username, []), vuid: `offline-${username}`, offline: true };
  }
  try {
    const payload = await verifyTideCloakToken(tcConfig, auth.slice(7), ["offline_access"]);
    if (!payload) return null;
    const username = String(payload.preferred_username || payload.username || "").toLowerCase();
    const realmRoles = payload.realm_access?.roles || [];
    return { username, role: roleOf(username, realmRoles), vuid: payload.vuid };
  } catch (err) {
    console.error("token verification failed", err);
    return null;
  }
}

export const deny = (status, error) => NextResponse.json({ error }, { status });
