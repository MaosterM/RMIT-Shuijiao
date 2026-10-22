"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useZenithium } from "../../lib/useZenithium";
import { FAMILY, TIDE_TAG, DOC_TYPES } from "../../lib/family";
import { randomBytes, aesEncrypt, aesEncryptText, splitSecret, rsaEncrypt, toB64 } from "../../lib/crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

export default function SealPage() {
  const { authenticated, login, role, name, username, api, doEncrypt } = useZenithium();
  const [keys, setKeys] = useState({});
  const [vault, setVault] = useState(null);
  const [form, setForm] = useState({ will: "", ic: "", assets: "" });
  const [docs, setDocs] = useState([]); // [{file, docType}]
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const refresh = useCallback(async () => {
    const [k, v] = await Promise.all([api("/api/keys"), api("/api/vault")]);
    setKeys(k.keys);
    setVault(v.vault);
  }, [api]);

  useEffect(() => {
    if (authenticated) refresh().catch((e) => setMsg({ type: "warn", text: e.message }));
  }, [authenticated, refresh]);

  if (!authenticated) return <div className="card"><h2>Seal the Vault</h2><p className="muted">Please log in as the planner.</p><button className="btn" onClick={() => login()}>Log in with Tide</button></div>;
  if (role !== "planner") return <div className="card"><h2>Seal the Vault</h2><p className="muted">This page is for the planner ({FAMILY.planner.name}). You are logged in as {name} ({role}).</p></div>;

  const missingKeys = FAMILY.heirs.filter((h) => !keys[h.username]);

  const addFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return setMsg({ type: "warn", text: "This file type isn't supported. Please choose a PDF, JPG or PNG." });
    if (file.size > MAX_BYTES) return setMsg({ type: "warn", text: "This file is a little too large (over 5 MB). Could you try a smaller copy?" });
    setDocs((d) => [...d, { file, docType }]);
    setMsg(null);
  };

  const seal = async () => {
    setBusy(true);
    setMsg({ type: "info", text: "Sealing everything safely in your browser…" });
    try {
      const vaultKey = randomBytes(32);

      // 1) Text fields: TideCloak doEncrypt (planner's own sealed copy) + AES-GCM under the vault key (for the heirs)
      const [tWill, tIc, tAssets] = await doEncrypt([
        { data: form.will, tags: [TIDE_TAG] },
        { data: form.ic, tags: [TIDE_TAG] },
        { data: form.assets, tags: [TIDE_TAG] },
      ]);
      const content = await aesEncryptText(vaultKey, JSON.stringify(form));

      // 2) Files: envelope encryption. A random AES key per file encrypts the bytes; that key is
      //    sealed with TideCloak doEncrypt (planner copy) and with the vault key (heir copy).
      const files = [];
      for (const { file, docType: type } of docs) {
        const fileKey = randomBytes(32);
        const bytes = new Uint8Array(await file.arrayBuffer());
        const [keyTide] = await doEncrypt([{ data: toB64(fileKey), tags: [TIDE_TAG] }]);
        files.push({
          id: `doc_${files.length + 1}`,
          docType: type,
          uploadedAt: new Date().toISOString(),
          uploader: username,
          sizeBytes: file.size,
          meta: await aesEncryptText(fileKey, JSON.stringify({ name: file.name, mime: file.type })),
          body: await aesEncrypt(fileKey, bytes),
          keyTide,
          keyVault: await aesEncrypt(vaultKey, fileKey),
        });
      }

      // 3) Split the vault key between the heirs (Shamir) and encrypt each share to that heir's key
      const parts = splitSecret(vaultKey, FAMILY.heirs.length, FAMILY.threshold);
      const shares = await Promise.all(
        FAMILY.heirs.map(async (h, i) => ({ heir: h.username, encShare: await rsaEncrypt(keys[h.username].publicJwk, parts[i]) }))
      );
      vaultKey.fill(0);

      await api("/api/vault", {
        method: "POST",
        body: JSON.stringify({ plannerCopy: { will: tWill, ic: tIc, assets: tAssets }, content, files, shares, threshold: FAMILY.threshold }),
      });
      setForm({ will: "", ic: "", assets: "" });
      setDocs([]);
      setMsg({ type: "ok", text: "Thank you. Everything is now safely sealed. Only scrambled text was sent to Zenithium; your family can open it together when the time comes." });
      await refresh();
    } catch (e) {
      setMsg({ type: "warn", text: `Something went wrong while sealing. Nothing was saved. Please try again. (${e.message})` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="row"><h2 style={{ margin: 0 }}>Seal the Vault</h2>{vault ? <span className="badge sealed">SEALED</span> : null}</div>
        <p className="muted">
          Take your time. Write down what your loved ones will need to know, and add any papers that will help them. Everything is sealed <strong>on this device</strong> before it is saved,
          and it can only be opened when {FAMILY.threshold} of {FAMILY.heirs.length} of your heirs agree together.
        </p>
        {vault && <div className="notice info small">A vault was sealed on {new Date(vault.sealedAt).toLocaleString()} with {vault.files.length} document(s). Sealing again replaces it.</div>}
        {missingKeys.length > 0 && (
          <div className="notice warn small">
            Waiting for {missingKeys.map((h) => h.name).join(" and ")} to log in once and set up their family key (Family Vault page). You can seal the vault as soon as they have.
          </div>
        )}
      </div>

      <div className="card">
        <label>Will summary</label>
        <textarea value={form.will} onChange={(e) => setForm({ ...form, will: e.target.value })} placeholder="e.g. The house in Ipoh goes to Mei Ling; the shop lot in Klang goes to Wei Jie…" />
        <label>IC number (MyKad)</label>
        <input type="text" value={form.ic} onChange={(e) => setForm({ ...form, ic: e.target.value })} placeholder="e.g. 520314-08-5521" />
        <label>Assets</label>
        <textarea value={form.assets} onChange={(e) => setForm({ ...form, assets: e.target.value })} placeholder="e.g. Maybank savings, EPF, Great Eastern policy, land title in Klang…" />

        <label>Documents (PDF, JPG or PNG, up to 5 MB each)</label>
        <div className="row">
          <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ maxWidth: 260 }}>
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={addFile} />
        </div>
        {docs.length > 0 && (
          <table style={{ marginTop: 10 }}>
            <tbody>
              {docs.map((d, i) => (
                <tr key={i}>
                  <td>{d.docType}</td>
                  <td>{d.file.name}</td>
                  <td className="muted">{(d.file.size / 1024).toFixed(0)} KB</td>
                  <td><button className="btn secondary" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn" disabled={busy || missingKeys.length > 0 || !form.will.trim()} onClick={seal}>
            {busy ? "Sealing…" : "Encrypt and seal the vault"}
          </button>
          <Link href="/database" className="btn secondary">Open Database View</Link>
        </div>
        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      </div>
    </>
  );
}
