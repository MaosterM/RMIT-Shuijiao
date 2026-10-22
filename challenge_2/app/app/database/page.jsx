"use client";
import { useEffect, useState, useCallback } from "react";
import { useZenithium } from "../../lib/useZenithium";

// Shorten huge base64 blobs for display only; the full record is what's stored.
function shorten(value) {
  if (typeof value === "string" && value.length > 96) return `${value.slice(0, 64)}…(${value.length.toLocaleString()} chars)`;
  if (Array.isArray(value)) return value.map(shorten);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shorten(v)]));
  return value;
}

export default function DatabasePage() {
  const { authenticated, login, api } = useZenithium();
  const [db, setDb] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => api("/api/db").then(setDb).catch((e) => setErr(e.message)), [api]);
  useEffect(() => {
    if (authenticated) load();
  }, [authenticated, load]);

  if (!authenticated) return <div className="card"><h2>Database View</h2><p className="muted">Log in to see the raw stored records.</p><button className="btn" onClick={() => login()}>Log in with Tide</button></div>;

  const v = db?.vault;
  return (
    <>
      <div className="card">
        <div className="row"><h2 style={{ margin: 0 }}>Database View: what an admin or attacker sees</h2><button className="btn secondary" onClick={load}>Refresh</button></div>
        <p className="muted">
          This is the raw content of Zenithium's database file (<span className="mono">data/db.json</span>). A Zenithium admin, the hosting company or a
          hacker who copies it gets exactly this. The will, the IC number, the assets and the documents are all ciphertext. The keys that could
          open them are held by TideCloak's decentralised network and split between the heirs, never by Zenithium.
        </p>
        {err && <div className="notice warn">{err}</div>}
      </div>

      {v ? (
        <div className="card">
          <h3>Sealed vault record</h3>
          <table>
            <tbody>
              <tr><th>Field</th><th>Stored value</th></tr>
              <tr><td>Will summary (TideCloak)</td><td className="mono">{shorten(v.plannerCopy?.will)}</td></tr>
              <tr><td>IC number (TideCloak)</td><td className="mono">{shorten(v.plannerCopy?.ic)}</td></tr>
              <tr><td>Assets (TideCloak)</td><td className="mono">{shorten(v.plannerCopy?.assets)}</td></tr>
              <tr><td>Family copy (AES-GCM)</td><td className="mono">{shorten(v.content?.ct)}</td></tr>
              {v.files.map((f) => (
                <tr key={f.id}>
                  <td>Document: {f.docType}<div className="small muted">{new Date(f.uploadedAt).toLocaleString()} · by {f.uploader}</div></td>
                  <td className="mono">{shorten(f.body?.ct)}</td>
                </tr>
              ))}
              {v.shares.map((s) => (
                <tr key={s.heir}><td>Key share for {s.heir}</td><td className="mono">{shorten(s.encShare)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">In the clear, only non-sensitive metadata is stored: document type, upload date, uploader and the list of heirs.</p>
        </div>
      ) : (
        <div className="card muted">No vault has been sealed yet.</div>
      )}

      <div className="card">
        <h3>Raw JSON</h3>
        <pre className="raw">{db ? JSON.stringify(shorten(db), null, 2) : "Loading…"}</pre>
      </div>
    </>
  );
}
