"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/chains";
import { shortenAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
  const onWrongNetwork = isConnected && chainId !== monadTestnet.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => injected && connect({ connector: injected })}
        disabled={isPending}
        style={btn.primary}
      >
        {isPending ? "Opening wallet…" : "Connect wallet"}
      </button>
    );
  }

  if (onWrongNetwork) {
    return (
      <button onClick={() => switchChain({ chainId: monadTestnet.id })} style={btn.warn}>
        Switch to Monad testnet
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="mono" style={{ fontSize: 13, color: "var(--fog-dim)" }}>
        {shortenAddress(address)}
      </span>
      <button onClick={() => disconnect()} style={btn.ghost}>
        Disconnect
      </button>
    </div>
  );
}

const base: React.CSSProperties = {
  height: 38,
  padding: "0 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  border: "1px solid transparent",
  transition: "background 120ms, border-color 120ms",
};

const btn = {
  primary: {
    ...base,
    background: "var(--accent)",
    color: "var(--void)",
  } as React.CSSProperties,
  warn: {
    ...base,
    background: "transparent",
    borderColor: "var(--held)",
    color: "var(--held)",
  } as React.CSSProperties,
  ghost: {
    ...base,
    background: "transparent",
    borderColor: "var(--hairline-strong)",
    color: "var(--fog-dim)",
  } as React.CSSProperties,
};
