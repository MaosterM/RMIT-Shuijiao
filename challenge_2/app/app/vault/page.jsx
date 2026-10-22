"use client";
import { useEffect, useState, useCallback } from "react";
import { useZenithium } from "../../lib/useZenithium";
import { FAMILY, TIDE_TAG, displayName } from "../../lib/family";
import { generateHeirKeypair, rsaEncrypt, rsaDecrypt, combineShares, aesDecrypt, aesDecryptText, keyFingerprint } from "../../lib/crypto";

export default function VaultPage() {
  const { authenticated, login, role, name, username, api, doEncrypt, doDecrypt } = useZenithium();
  const [vault, setVault] = useState(null);
  const [unlock, setUnlock] = useState(null);
  const [keys, setKeys] = useState({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const [opened, setOpened] = useState(null); // { content, files: [{docType, name, url}] }
  const [plan, setPlan] = useState(null);
  const [myFp, setMyFp] = useState("");

  const refresh = useCallback(async () => {
    const [v, k] = await Promise.all([api("/api/vault"), api("/api/keys")]);
    setVault(v.vault);
    setUnlock(v.unlock);
    setKeys(k.keys);
    const p = await api("/api/plan");
    setPlan(p.plan);
    const mine = k.keys[k.me?.username];
    setMyFp(mine ? await keyFingerprint(mine.publicJwk) : "");
  }, [api]);

  // Live progress: poll every 3 seconds so approvals from another laptop show up.
  useEffect(() => {
    if (!authenticated) return;
    refresh().catch((e) => setMsg({ type: "warn", text: e.message }));
    const t = setInterval(() => refresh().catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [authenticated, refresh]);

  if (!authenticated) return <div className="card"><h2>Family Vault</h2><p className="muted">Please log in with your own Tide account.</p><button className="btn" onClick={() => login()}>Log in with Tide</button></div>;
  if (role !== "heir") return <div className="card"><h2>Family Vault</h2><p className="muted">This page is for the heirs ({FAMILY.heirs.map((h) => h.name).join(", ")}). You are logged in as {name} ({role}).</p></div>;

  const myKey = keys[username];
  const approvals = unlock?.approvals || [];
  const threshold = vault?.threshold || FAMILY.threshold;
  const iApproved = approvals.some((a) => a.heir === username);
  const quorumMet = approvals.length >= threshold;

  // Unseal MY private key with MY TideCloak identity (doDecrypt only works for the account that encrypted it).
  const myPrivateKey = async () => {
    const [jwk] = await doDecrypt([{ encrypted: myKey.sealedPrivateKey, tags: [TIDE_TAG] }]);
    return JSON.parse(String(jwk));
  };

  const setupKey = async () => {
    setBusy("key");
    try {
      const { publicJwk, privateJwk } = await generateHeirKeypair();
      const [sealedPrivateKey] = await doEncrypt([{ data: JSON.stringify(privateJwk), tags: [TIDE_TAG] }]);
      await api("/api/keys", { method: "POST", body: JSON.stringify({ publicJwk, sealedPrivateKey }) });
      setMsg({ type: "ok", text: "Your family key is ready. Its private half is sealed with your own Tide account, so only you can use it." });
      await refresh();
    } catch (e) {
      setMsg({ type: "warn", text: e.message });
    } finally {
      setBusy("");
    }
  };

  const requestUnlock = async () => {
    setBusy("request");
    try {
      await api("/api/unlock", { method: "POST", body: JSON.stringify({ action: "request" }) });
      await refresh();
    } catch (e) {
      setMsg({ type: "warn", text: e.message });
    } finally {
      setBusy("");
    }
  };

  // Approve = unseal my key share and re-encrypt it to every heir's public key.
  const approve = async () => {
    setBusy("approve");
    try {
      const priv = await myPrivateKey();
      const mine = vault.shares.find((s) => s.heir === username);
      const share = await rsaDecrypt(priv, mine.encShare);
      const released = await Promise.all(vault.heirs.map(async (h) => ({ to: h, encShare: await rsaEncrypt(keys[h].publicJwk, share) })));
      share.fill(0);
      await api("/api/unlock", { method: "POST", body: JSON.stringify({ action: "approve", released }) });
      setMsg({ type: "ok", text: "Thank you. Your approval has been added. The vault opens once enough of the family has agreed." });
      await refresh();
    } catch (e) {
      setMsg({ type: "warn", text: `Could not approve: ${e.message}` });
    } finally {
      setBusy("");
    }
  };

  // Open = collect the shares released to me; with fewer than `threshold` the vault key cannot be rebuilt.
  const openVault = async () => {
    setBusy("open");
    setMsg(null);
    try {
      const forMe = (unlock?.released || []).filter((r) => r.to === username);
      const distinct = [...new Map(forMe.map((r) => [r.from, r])).values()];
      if (distinct.length < threshold) {
        setMsg({ type: "warn", text: `The vault stays sealed for now: ${distinct.length} of ${threshold} family approvals so far. It can only open when ${threshold} of you agree, never by Zenithium and never by any one person alone.` });
        return;
      }
      const priv = await myPrivateKey();
      const shares = await Promise.all(distinct.slice(0, threshold).map((r) => rsaDecrypt(priv, r.encShare)));
      const vaultKey = combineShares(shares);
      const content = JSON.parse(await aesDecryptText(vaultKey, vault.content));
      const files = [];
      for (const f of vault.files) {
        const fileKey = await aesDecrypt(vaultKey, f.keyVault);
        const meta = JSON.parse(await aesDecryptText(fileKey, f.meta));
        const bytes = await aesDecrypt(fileKey, f.body);
        files.push({ id: f.id, docType: f.docType, name: meta.name, url: URL.createObjectURL(new Blob([bytes], { type: meta.mime })) });
      }
      setOpened({ content, files });
    } catch (e) {
      setMsg({ type: "warn", text: `Could not open the vault: ${e.message}` });
    } finally {
      setBusy("");
    }
  };

  const badge = !vault ? null : quorumMet ? <span className="badge unlocked">UNLOCKED</span> : approvals.length > 0 ? <span className="badge progress">{approvals.length} OF {threshold} APPROVED</span> : <span className="badge sealed">SEALED</span>;

  return (
    <>
      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>Family Vault</h2>
          {badge}
          <span className="badge sim" title="See MOCKED.md">SIMULATED QUORUM</span>
        </div>
        <p className="muted">
          Welcome, {name}. We're so sorry for your loss. What the person who passed away left for the family is kept safely sealed here. It opens only when {threshold} of{" "}
          {vault?.heirs?.length || plan?.heirs?.length || FAMILY.heirs.length} of you agree, each from your own Tide account, so no one has to carry this alone.
        </p>
        <p className="small muted">
          SIMULATED QUORUM: the approval workflow is run by Zenithium, not by TideCloak's own change-request quorum. The vault key itself is never held by
          Zenithium: it is split between the heirs, and the encryption is real. See MOCKED.md.
        </p>
      </div>

      {!vault && !plan?.heirs?.includes(username) && !myKey && (
        <div className="card muted">{FAMILY.planner.name} hasn't named you as an heir yet. When he does, you'll be asked to set up your family key here.</div>
      )}

      {vault && !vault.heirs.includes(username) && (
        <div className="card muted">You are not one of the heirs named in this vault, so there is nothing for you to open here.</div>
      )}

      {!myKey && plan?.heirs?.includes(username) && (
        <div className="notice info">
          <strong>{FAMILY.planner.name} has named you as one of his heirs.</strong> The vault will open when {plan.threshold} of {plan.heirs.length} heirs agree.
          Please set up your family key below so he can seal the vault for you.
        </div>
      )}

      {myKey && myFp && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Your family key</h3>
          <p className="muted small">If {FAMILY.planner.name} asks, read him this code. He checks that it matches the one on his screen, so he knows this key is really yours.</p>
          <p className="mono" style={{ fontSize: "1.3rem", letterSpacing: "0.08em" }}>{myFp}</p>
        </div>
      )}

      {!myKey && (plan?.heirs?.includes(username) || vault?.heirs?.includes(username)) && (
        <div className="card">
          <h3>Step 1: set up your family key (one time)</h3>
          <p className="muted small">This creates your personal key in this browser and seals its private half with your Tide account, so only you can use it.</p>
          <button className="btn" disabled={!!busy} onClick={setupKey}>{busy === "key" ? "Setting up…" : "Set up my family key"}</button>
        </div>
      )}

      {myKey && !vault && <div className="card muted">Your family key is ready. Nothing has been sealed for the family yet.</div>}


      {myKey && vault && vault.heirs.includes(username) && (
        <div className="card">
          <h3>Unlock progress</h3>
          <div className="progressbar"><div style={{ width: `${Math.min(100, (approvals.length / threshold) * 100)}%` }} /></div>
          <p><strong>{approvals.length} of {threshold}</strong> approvals{unlock ? ` · requested by ${displayName(unlock.requestedBy)}` : ""}</p>
          <ul className="small">
            {vault.heirs.map((h) => {
              const a = approvals.find((x) => x.heir === h);
              return <li key={h}>{displayName(h)}: {a ? `approved ${new Date(a.at).toLocaleTimeString()}` : "not yet"}</li>;
            })}
          </ul>
          <div className="row">
            {!unlock && <button className="btn" disabled={!!busy} onClick={requestUnlock}>{busy === "request" ? "Requesting…" : "Request unlock"}</button>}
            {unlock && !iApproved && <button className="btn" disabled={!!busy} onClick={approve}>{busy === "approve" ? "Approving…" : "Approve unlock"}</button>}
            <button className="btn secondary" disabled={!!busy} onClick={openVault}>{busy === "open" ? "Opening…" : "Open the vault"}</button>
          </div>
          {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
        </div>
      )}

      {!vault && msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      {opened && (
        <div className="card">
          <div className="row"><h3 style={{ margin: 0 }}>What was left for your family</h3><span className="badge unlocked">UNLOCKED</span></div>
          <label>Will summary</label>
          <div className="plain">{opened.content.will}</div>
          <label>IC number</label>
          <div className="plain">{opened.content.ic}</div>
          <label>Assets</label>
          <div className="plain">{opened.content.assets}</div>
          <label>Documents</label>
          {opened.files.length === 0 ? <p className="muted">No documents.</p> : (
            <ul>{opened.files.map((f) => <li key={f.id}>{f.docType}: <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a></li>)}</ul>
          )}
        </div>
      )}
    </>
  );
}
