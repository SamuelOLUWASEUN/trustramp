"use client";

import { useState } from "react";
import { escrowConfigured } from "@/lib/contract";
import { ConnectButton } from "@/components/ConnectButton";
import { RateCheck } from "@/components/RateCheck";
import { CreateTrade } from "@/components/CreateTrade";
import { TradeList } from "@/components/TradeList";
import { ReputationLookup } from "@/components/ReputationLookup";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <main style={page.wrap}>
      <header style={page.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={page.mark} aria-hidden="true" />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Trustramp
          </span>
        </div>
        <ConnectButton />
      </header>

      <section style={page.hero}>
        <div className="eyebrow" style={{ marginBottom: 18 }}>
          P2P remittance · UK ↔ Nigeria
        </div>
        <h1 style={page.h1}>
          Lock the crypto.
          <br />
          Release it when the naira lands.
        </h1>
        <p style={page.sub}>
          P2P trades run on trust you don&apos;t have. Trustramp holds the stablecoin in an onchain
          escrow, so neither side has to go first blind — and every trade builds a reputation the
          next counterparty can check.
        </p>
      </section>

      {!escrowConfigured && <NotConfigured />}

      <div style={page.rateRow} className="stack-mobile">
        <RateCheck />
        <ReputationLookup />
      </div>

      <div style={page.grid} className="stack-mobile">
        <div>
          <CreateTrade onCreated={bump} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Your trades
          </div>
          <TradeList refreshKey={refreshKey} />
        </div>
      </div>

      <footer style={page.footer}>
        <span className="mono" style={{ fontSize: 11, color: "var(--fog-faint)" }}>
          Escrow settles on Monad · funds are never custodied by Trustramp
        </span>
      </footer>
    </main>
  );
}

function NotConfigured() {
  return (
    <div style={page.notice}>
      <strong style={{ color: "var(--held)", fontWeight: 500 }}>Contract not set.</strong>{" "}
      <span style={{ color: "var(--fog-dim)" }}>
        Deploy the escrow contract and add its address to{" "}
        <code className="mono">NEXT_PUBLIC_ESCROW_ADDRESS</code> in{" "}
        <code className="mono">.env.local</code> to enable trades.
      </span>
    </div>
  );
}

const page = {
  wrap: {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "0 24px 80px",
  } as React.CSSProperties,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 0",
    borderBottom: "1px solid var(--hairline)",
    position: "sticky",
    top: 0,
    background: "var(--void)",
    zIndex: 10,
  } as React.CSSProperties,
  mark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: "var(--accent)",
    boxShadow: "inset 0 0 0 3px var(--void), 0 0 0 1px var(--accent)",
  } as React.CSSProperties,
  hero: { padding: "64px 0 48px", maxWidth: 680 } as React.CSSProperties,
  h1: {
    fontSize: "clamp(30px, 5vw, 46px)",
    fontWeight: 600,
    lineHeight: 1.08,
    letterSpacing: "-0.02em",
    marginBottom: 22,
  } as React.CSSProperties,
  sub: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "var(--fog-dim)",
  } as React.CSSProperties,
  rateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 420px) minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
  } as React.CSSProperties,
  notice: {
    background: "rgba(251, 191, 36, 0.06)",
    border: "1px solid rgba(251, 191, 36, 0.25)",
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 16,
  } as React.CSSProperties,
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: "1px solid var(--hairline)",
    textAlign: "center",
  } as React.CSSProperties,
};
