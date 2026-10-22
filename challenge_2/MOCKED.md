# What is mocked or simulated in Zenithium

This prototype was built in one afternoon for RMIT Hackathon 2026, Challenge 2. Everything below that isn't marked **REAL** is simulated or out of scope.

## REAL (working in the prototype)

| Feature | How |
|---|---|
| Login with TideCloak | Official `@tidecloak/nextjs` template: `TideCloakProvider`, `useTideCloak()`, Tide accounts |
| Server-side identity | Every API route verifies the TideCloak access token with `verifyTideCloakToken` (`lib/serverAuth.js`). The caller's identity comes from the verified token, never from the request body. |
| Text encryption with TideCloak | Will summary, IC number and asset list are encrypted in the planner's browser with TideCloak `doEncrypt` (tag `message`) before being saved (`app/seal/page.jsx`) |
| File envelope encryption | Each file is encrypted with a random AES-256-GCM key (WebCrypto). That key is sealed with TideCloak `doEncrypt` (planner copy) and with the vault key (heir copy). |
| Heir keys protected by TideCloak | Each heir's personal RSA private key is sealed with that heir's own TideCloak `doEncrypt`. Only that heir's Tide account can unseal it (`doDecrypt`). |
| "No single heir can unlock" | The vault key is split with Shamir secret sharing (`lib/crypto.js`). With fewer than *threshold* shares, the key is mathematically impossible to rebuild, so this is not just a UI check. |
| "Admin can't read" | The server and `data/db.json` hold only ciphertext and non-sensitive metadata (Database View shows the raw file) |

## OFFLINE DEMO MODE (fallback, shown by a red banner at the top of every page)

If TideCloak has not been provisioned (`app/tidecloak.json` has no `realm`), the app runs in **OFFLINE DEMO MODE**:
- **login** is a simple username prompt;
- **`doEncrypt` / `doDecrypt`** are simulated with an AES key derived from the username (`app/lib/mockTide.js`);
- **the server** accepts a `mock.<username>` token instead of verifying a TideCloak token (`app/lib/serverAuth.js`).

**This mode is not secure.** It exists only so that the flow can be demonstrated when TideCloak can't be set up. Everything else (AES-GCM, Shamir splitting, RSA share passing, the ciphertext-only database, role checks, distinct approvals) runs the same code in both modes.

**Why it exists:** during the hackathon (22 Oct 2026), the TideCloak realm initialisation (`npm run init` → `setUpTideRealm`) failed repeatedly on Tide's side with `TIDE-IDPEXT-VENDOR-KEYGEN_FAILED` (`Midgard.FinalizeWallet` → HTTP 500, "Not enough orks returned an ok response"; Tide's node returned HTTP 503). This happened with several licence emails, on a clean network. As soon as `npm run init` succeeds, the app automatically uses real TideCloak, with no code changes. **If the demo video shows the red OFFLINE DEMO MODE banner, the TideCloak parts in that video are simulated.**

## SIMULATED / MOCKED

1. **SIMULATED QUORUM (approval workflow).** TideCloak has a real quorum feature, *change requests* (draft → approvals → commit), but it governs **admin actions** such as assigning a role. TideCloak's `selfdecrypt` role only lets a user decrypt data **they encrypted themselves**. So granting heirs a role through a change request would *not* let them open the planner's documents. We therefore run the approval workflow in the app:
   - each approval must come from a distinct heir, identified by their verified TideCloak token;
   - an approval is the heir unsealing their own key share (TideCloak `doDecrypt`) and re-sharing it, encrypted, with the other heirs;
   - the vault opens only in an heir's browser once *threshold* shares are present.

   **What this means for trust:** Zenithium can't open the vault, because it never holds the vault key or any plaintext share. But Zenithium *does* run the workflow, so a malicious Zenithium server could refuse to record approvals (denial of service). It could also substitute a fake heir public key **before** sealing (see limitation 3). Moving the approval rules into TideCloak's own quorum governance is future work.
2. **Death verification.** There is no check that the person has passed away (in real life: JPN death certificate, court grant of probate or letters of administration). Any heir can request an unlock at any time.
3. **Key authenticity.** The planner trusts the heir public keys that the Zenithium server returns. A production version would verify them, e.g. a fingerprint shown to the planner and the heir, or keys bound to the Tide identity.
4. **Storage.** A local JSON file (`app/data/db.json`) stands in for a real database. Files are stored inline as base64.
5. **Roles.** Planner and heir roles come from TideCloak realm roles `planner` / `heir` if you assign them. For a quick demo, they fall back to a fixed username list in `app/lib/family.js`.
6. **Planner copy.** The text fields are also stored as a TideCloak `doEncrypt` copy that only the planner can decrypt. The prototype stores it to show TideCloak encryption, but has no screen that reads it back.
7. **No OCR, no scanning, no payments, no notifications, no multi-vault support.** One vault per installation.
