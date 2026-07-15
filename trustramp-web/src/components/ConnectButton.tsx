"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/chains";
import { shortenAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Detect an actual injected wallet provider (MetaMask extension, or MetaMask's
  // own in-app browser). Regular mobile Safari/Chrome have nothing here — clicking
  // "Connect wallet" in that case has nothing to connect to, which is why it did
  // nothing before. We now branch on this instead of failing silently.
  const [hasInjectedProvider, setHasInjectedProvider] = useState<boolean | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    setHasInjectedProvider(
      typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined"
    );
  }, []);

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
  const onWrongNetwork = isConnected && chainId !== monadTestnet.id;

  async function handleConnect() {
    setConnectError(null);
    if (!injected) return;
    try {
      await connect({ connector: injected });
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect. Try again.");
    }
  }

  function openInMetaMask() {
    const target = `${window.location.host}${window.location.pathname}`;
    window.location.href = `https://metamask.app.link/dapp/${target}`;
  }

  if (!isConnected) {
    // Still checking for a provider — render nothing rather than a button that
    // might immediately be wrong, avoiding a flash of the incorrect state.
    if (hasInjectedProvider === null) {
      return <div style={{ width: 130, height: 38 }} aria-hidden="true" />;
    }

    if (!hasInjectedProvider) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <button onClick={openInMetaMask} style={btn.primary}>
            Open in MetaMask
          </button>
          <span style={{ fontSize: 10.5, color: "var(--fog-faint)" }}>
            No wallet detected in this browser
          </span>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <button onClick={handleConnect} disabled={isPending} style={btn.primary}>
          {isPending ? "Opening wallet…" : "Connect wallet"}
        </button>
        {connectError && (
          <span style={{ fontSize: 10.5, color: "var(--dispute)", maxWidth: 200, textAlign: "right" }}>
            {connectError}
          </span>
        )}
      </div>
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
