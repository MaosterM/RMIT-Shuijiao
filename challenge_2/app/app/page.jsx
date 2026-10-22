"use client";
import Link from "next/link";
import { useZenithium } from "../lib/useZenithium";
import { FAMILY } from "../lib/family";

export default function Home() {
  const { authenticated, login, role } = useZenithium();
  return (
    <>
      <section className="hero card">
        <span className="badge sealed">WITH CARE, FOR FAMILIES IN MALAYSIA</span>
        <h1>Zenithium: your family's wishes, kept safe together</h1>
        <p>
          Losing someone you love is hard enough. The papers they leave behind, such as their will, MyKad, land titles and savings,
          shouldn't become another worry, or rest in the hands of just one person. Zenithium keeps them gently sealed, and opens them
          only when the family comes together. <strong>Not even we can look inside.</strong>
        </p>
        <div className="row">
          {!authenticated && <button className="btn" onClick={() => login()}>Log in with Tide</button>}
          {authenticated && role === "planner" && <Link className="btn" href="/seal">Prepare and seal the vault</Link>}
          {authenticated && role === "heir" && <Link className="btn" href="/vault">Go to the family vault</Link>}
          <Link className="btn secondary" href="/database">See what we store</Link>
        </div>
      </section>

      <div className="grid3">
        <div className="card">
          <h3>🔒 Admin can't read</h3>
          <p className="muted">Everything we store is sealed. Our team, our hosting provider, or anyone who breaks in would only ever see scrambled text, never your loved one's words.</p>
        </div>
        <div className="card">
          <h3>🤝 No single heir can unlock</h3>
          <p className="muted">The key is shared among the family. It takes {FAMILY.threshold} of {FAMILY.heirs.length} heirs, each confirming from their own Tide account, to open what was left for you.</p>
        </div>
        <div className="card">
          <h3>🌿 Documents encrypted before they leave your device</h3>
          <p className="muted">Words and documents are sealed in your own browser, with TideCloak guarding the keys, before anything leaves your hands.</p>
        </div>
      </div>

      <div className="card small muted">
        Shown here with the Lim family: {FAMILY.planner.name} (planner) · {FAMILY.heirs.map((h) => `${h.name} (${h.relation})`).join(" · ")}.
        This prototype does not yet confirm a passing with official records (see MOCKED.md).
      </div>
    </>
  );
}
