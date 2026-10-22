"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useZenithium } from "../lib/useZenithium";

const LINKS = [
  ["/", "Home"],
  ["/seal", "Seal the Vault"],
  ["/database", "Database View"],
  ["/vault", "Family Vault"],
];

export default function Nav() {
  const path = usePathname();
  const { authenticated, isInitializing, login, logout, name, role, offline } = useZenithium();
  return (
    <>
    {offline && (
      <div style={{ background: "#f7e6e3", color: "#6d3a33", textAlign: "center", padding: "6px 12px", fontSize: "0.85rem", borderBottom: "1px dashed #a5574c" }}>
        <strong>OFFLINE DEMO MODE: TideCloak SIMULATED.</strong> TideCloak could not be provisioned, so login and doEncrypt/doDecrypt are simulated locally and are not secure. Run <code>npm run init</code> to switch to real TideCloak. See MOCKED.md.
      </div>
    )}
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">Zenithium</Link>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={`link ${path === href ? "active" : ""}`}>{label}</Link>
        ))}
        <span className="spacer" />
        {isInitializing ? (
          <span className="who">Connecting to TideCloak…</span>
        ) : authenticated ? (
          <>
            <span className="who">{name} · <strong>{role}</strong></span>
            <button className="btn secondary" onClick={() => logout()}>Log out</button>
          </>
        ) : (
          <button className="btn" onClick={() => login()}>Log in with Tide</button>
        )}
      </div>
    </nav>
    </>
  );
}
