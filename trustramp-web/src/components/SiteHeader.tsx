"use client";

import Link from "next/link";
import { WalletBanner } from "@/components/WalletBanner";
import { ConnectButton } from "@/components/ConnectButton";

export function SiteHeader() {
  return (
    <div className="sticky-top">
      <WalletBanner />
      <header className="site-header">
        <div style={headerInner}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={mark} aria-hidden="true" />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Trustramp
            </span>
          </Link>
          <ConnectButton />
        </div>
      </header>
    </div>
  );
}

const headerInner: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
  // Same horizontal clamp as the page wrap so the logo lines up exactly with the
  // card edges below it, even though the frosted bar itself is full-bleed.
  padding: "calc(18px + env(safe-area-inset-top, 0px)) clamp(20px, 5vw, 48px) 18px",
};

const mark: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  background: "var(--accent)",
  boxShadow: "inset 0 0 0 3px var(--void), 0 0 0 1px var(--accent)",
  flexShrink: 0,
};
