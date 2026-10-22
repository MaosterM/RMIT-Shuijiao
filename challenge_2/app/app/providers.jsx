"use client";
// Official TideCloak provider from the template; tidecloak.json is written by `npm run init`.
// If TideCloak isn't provisioned, fall back to the clearly labelled OFFLINE DEMO MODE.
import { TideCloakProvider } from "@tidecloak/nextjs";
import { TIDE_ENABLED, tcConfig } from "../lib/tideMode";
import { MockTideProvider } from "../lib/mockTide";

export function Providers({ children }) {
  if (!TIDE_ENABLED) return <MockTideProvider>{children}</MockTideProvider>;
  return <TideCloakProvider config={tcConfig}>{children}</TideCloakProvider>;
}
