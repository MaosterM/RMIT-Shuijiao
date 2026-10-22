"use client";
// Thin wrapper around the official useTideCloak() hook: who am I, what's my role, and an
// authenticated fetch that sends the TideCloak access token to our API routes.
import { useCallback, useMemo } from "react";
import { useTideCloak } from "@tidecloak/nextjs";
import { roleOf, displayName } from "./family";
import { TIDE_ENABLED } from "./tideMode";
import { useMockTide } from "./mockTide";

// TIDE_ENABLED is a build-time constant, so the same hook is always called (rules of hooks hold).
const useAuth = TIDE_ENABLED ? useTideCloak : useMockTide;

export function useZenithium() {
  const tc = useAuth();
  const { authenticated, token, getValueFromIdToken, hasRealmRole } = tc;

  const username = useMemo(() => {
    if (!authenticated || !token) return "";
    try {
      return String(getValueFromIdToken("preferred_username") || "").toLowerCase();
    } catch {
      return "";
    }
  }, [authenticated, token, getValueFromIdToken]);

  const role = useMemo(() => {
    if (!username) return "guest";
    const realmRoles = ["planner", "heir"].filter((r) => {
      try {
        return hasRealmRole(r);
      } catch {
        return false;
      }
    });
    return roleOf(username, realmRoles);
  }, [username, hasRealmRole]);

  const api = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}), Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
      return data;
    },
    [token]
  );

  return { ...tc, offline: !TIDE_ENABLED, username, name: displayName(username), role, api };
}
