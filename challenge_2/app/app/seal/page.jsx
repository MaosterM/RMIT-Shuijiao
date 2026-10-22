"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useZenithium } from "../../lib/useZenithium";
import { FAMILY, TIDE_TAG, DOC_TYPES, displayName } from "../../lib/family";
import { randomBytes, aesEncrypt, aesEncryptText, splitSecret, rsaEncrypt, toB64, keyFingerprint } from "../../lib/crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

export default function SealPage() {
  const { authenticated, login, role, name, username, api, doEncrypt } = useZenithium();
  const [keys, setKeys] = useState({});
  const [fingerprints, setFingerprints] = useState({});
  const [vault, setVault] = useState(null);
  const [plan, setPlan] = useState(null);
  const [chosen, setChosen] = useState([]); // step 1 selection
  const [needed, setNeeded] = useState(FAMILY.threshold);
  const [confirmed, setConfirmed] = useState({}); // step 2: fingerprints checked with each heir
  const [form, setForm] = useState({ will: "", ic: "", assets: "" });
  const [docs, setDocs] = useState([]); // [{file, docType}]
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const refresh = useCallback(async () => {
    const [k, v, p] = await Promise.all([api("/api/keys"), api("/api/vault"), api("/api/plan")]);
    setKeys(k.keys);
    setVault(v.vault);
    setPlan(p.plan);
    const fps = {};
    for (const [u, key] of Object.entries(k.keys)) fps[u] = await keyFingerprint(key.publicJwk);
    setFingerprints(fps);
  }, [api]);

  // Poll so the heirs' key setup (on their own devices) shows up here live.
  useEffect(() => {
    if (!authenticated) return;
    refresh().catch((e) => setMsg({ type: "warn", text: e.message }));
    const t = setInterval(() => refresh().catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [authenticated, refresh]);

  const planKey = plan ? `${plan.heirs.join(",")}:${plan.threshold}` : "";
  useEffect(() => {
    if (plan) {
      setChosen(plan.heirs);
      setNeeded(plan.threshold);
    }
  }, [planKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authenticated) return <div className="card"><h2>Seal the Vault</h2><p className="muted">Please log in as the planner.</p><button className="btn" onClick={() => login()}>Log in with Tide</button></div>;
  if (role !== "planner") return <div className="card"><h2>Seal the Vault</h2><p className="muted">This page is for the planner ({FAMILY.planner.name}). You are logged in as {name} ({role}).</p></div>;

  const planned = plan?.heirs || [];
  const keysReady = planned.length > 0 && planned.every((h) => keys[h]);
  const allConfirmed = planned.length > 0 && planned.every((h) => confirmed[h] && keys[h]);
  const maxNeeded = Math.max(chosen.length, 1);

  const toggleChosen = (u) => setChosen((c) => (c.includes(u) ? c.filter((x) => x !== u) : [...c, u]));

  const nameHeirs = async () => {
    try {
      const t = Math.min(needed, chosen.length);
      await api("/api/plan", { method: "POST", body: JSON.stringify({ heirs: chosen, threshold: t }) });
      setConfirmed({});
      setMsg({ type: "ok", text: `You've named ${chosen.map(displayName).join(" and ")}. They'll be asked to set up their family keys.` });
      await refresh();
    } catch (e) {
      setMsg({ type: "warn", text: e.message });
    }
  };

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

      // 3) Split the vault key between the NAMED heirs (Shamir) and encrypt each share to that heir's confirmed key
      const parts = splitSecret(vaultKey, planned.length, plan.threshold);
      const shares = await Promise.all(planned.map(async (h, i) => ({ heir: h, encShare: await rsaEncrypt(keys[h].publicJwk, parts[i]) })));
      vaultKey.fill(0);

      await api("/api/vault", {
        method: "POST",
        body: JSON.stringify({ plannerCopy: { will: tWill, ic: tIc, assets: tAssets }, content, files, shares, threshold: plan.threshold }),
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
          Take your time. Choose who will look after your wishes, write down what your loved ones will need to know, and add any papers that will help them.
          Everything is sealed <strong>on this device</strong> before it is saved, and it opens only when enough of your heirs agree together.
        </p>
        {vault && <div className="notice info small">A vault was sealed on {new Date(vault.sealedAt).toLocaleString()} for {vault.heirs.map(displayName).join(" and ")} ({vault.threshold} of {vault.heirs.length} needed), with {vault.files.length} document(s). Sealing again replaces it.</div>}
      </div>

      {/* Step 1: choose heirs */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Step 1 · Choose who will hold the keys</h3>
        <p className="muted small">Each person you choose receives one piece of the key. No one can open the vault alone.</p>
        {FAMILY.heirs.map((h) => (
          <label key={h.username} style={{ fontWeight: 400, display: "flex", gap: 10, alignItems: "center" }}>
            <input type="checkbox" checked={chosen.includes(h.username)} onChange={() => toggleChosen(h.username)} />
            {h.name} <span className="muted small">({h.relation})</span>
          </label>
        ))}
        <div className="row" style={{ marginTop: 10 }}>
          <span>Approvals needed to open:</span>
          <select value={Math.min(needed, maxNeeded)} onChange={(e) => setNeeded(Number(e.target.value))} style={{ maxWidth: 110 }}>
            {Array.from({ length: maxNeeded }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} of {maxNeeded}</option>)}
          </select>
          <button className="btn" disabled={chosen.length === 0} onClick={nameHeirs}>{plan ? "Update my heirs" : "Name my heirs"}</button>
        </div>
      </div>

      {/* Step 2: confirm keys */}
      {plan && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Step 2 · Confirm your heirs' family keys</h3>
          <p className="muted small">
            Each heir sets up a family key on their own device. Compare the code below with the one shown on their screen, in person or by phone,
            so you know the key really belongs to them.
          </p>
          <table>
            <tbody>
              <tr><th>Heir</th><th>Family key</th><th>Code (fingerprint)</th><th>Checked with them</th></tr>
              {planned.map((h) => (
                <tr key={h}>
                  <td>{displayName(h)}</td>
                  <td>{keys[h] ? <span className="badge unlocked">READY</span> : <span className="badge progress">WAITING</span>}</td>
                  <td className="mono">{fingerprints[h] || "-"}</td>
                  <td>
                    <label style={{ fontWeight: 400, margin: 0 }}>
                      <input type="checkbox" disabled={!keys[h]} checked={!!confirmed[h]} onChange={(e) => setConfirmed({ ...confirmed, [h]: e.target.checked })} /> <span className="small">Yes, the codes match</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">{plan.threshold} of {planned.length} must agree to open the vault.</p>
        </div>
      )}

      {/* Step 3: write and seal */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Step 3 · Write down your wishes and seal</h3>
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

        {!plan && <div className="notice warn small">First, choose who will hold the keys (Step 1).</div>}
        {plan && !keysReady && <div className="notice warn small">Waiting for {planned.filter((h) => !keys[h]).map(displayName).join(" and ")} to set up their family key on the Family Vault page.</div>}
        {plan && keysReady && !allConfirmed && <div className="notice info small">Please confirm each heir's code in Step 2 before sealing.</div>}

        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn" disabled={busy || !allConfirmed || !form.will.trim()} onClick={seal}>
            {busy ? "Sealing…" : "Encrypt and seal the vault"}
          </button>
          <Link href="/database" className="btn secondary">Open Database View</Link>
        </div>
        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      </div>
    </>
  );
}
