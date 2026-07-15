"use client";

import { useAccount } from "wagmi";

export function WalletBanner() {
  const { isConnected } = useAccount();

  return (
    <div className={`wallet-banner${isConnected ? "" : " visible"}`} role="status">
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.01em",
        }}
      >
        No wallet connected — connect to start trading
      </div>
    </div>
  );
}
