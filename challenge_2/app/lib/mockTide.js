"use client";
// OFFLINE DEMO MODE: used only when tidecloak.json has no realm (TideCloak not provisioned).
// Mimics the useTideCloak() interface so the rest of the app is unchanged.
// SIMULATED and NOT SECURE: login is a username picker and doEncrypt/doDecrypt use a key derived
// locally from the username. Real deployments use TideCloak (see MOCKED.md).
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { aesEncrypt, aesDecrypt, toB64, fromB64, textBytes, bytesText } from "./crypto";

const Ctx = createContext(null);
const KEY = "zenithium-offline-user";

async function userKey(username) {
  const base = await crypto.subtle.importKey("raw", textBytes(`solace-offline-demo:${username}`), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: textBytes("solace-demo-salt"), iterations: 50000, hash: "SHA-256" }, base, 256);
  return new Uint8Array(bits);
}

export function MockTideProvider({ children }) {
  const [username, setUsername] = useState("");
  const [isInitializing, setInit] = useState(true);
  useEffect(() => {
    try {
      setUsername(localStorage.getItem(KEY) || "");
    } catch {}
    setInit(false);
  }, []);

  const login = useCallback(() => {
    const u = window.prompt("OFFLINE DEMO MODE: TideCloak login is SIMULATED.\nLog in as: limahkow (planner), limweijie or limmeiling (heirs)");
    if (!u) return;
    const clean = u.trim().toLowerCase();
    localStorage.setItem(KEY, clean);
    setUsername(clean);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUsername("");
  }, []);

  // Same shape as TideCloak: arrays in, arrays out; ciphertext is a string.
  const doEncrypt = useCallback(
    async (items) => {
      const k = await userKey(username);
      return Promise.all(items.map(async ({ data }) => {
        const bytes = typeof data === "string" ? textBytes(data) : data;
        const box = await aesEncrypt(k, bytes);
        return `offline-sim:${box.iv}:${box.ct}`;
      }));
    },
    [username]
  );
  const doDecrypt = useCallback(
    async (items) => {
      const k = await userKey(username);
      return Promise.all(items.map(async ({ encrypted }) => {
        const [, iv, ct] = String(encrypted).split(":");
        return bytesText(await aesDecrypt(k, { iv, ct }));
      }));
    },
    [username]
  );

  const value = useMemo(
    () => ({
      offline: true,
      authenticated: !!username,
      isInitializing,
      token: username ? `mock.${username}` : null,
      login,
      logout,
      getValueFromIdToken: (claim) => (claim === "preferred_username" ? username : undefined),
      hasRealmRole: () => false,
      doEncrypt,
      doDecrypt,
    }),
    [username, isInitializing, login, logout, doEncrypt, doDecrypt]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useMockTide = () => useContext(Ctx);
export { toB64, fromB64 };
