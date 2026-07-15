"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/chains";
import { shortenAddress } from "@/lib/format";
import { ThemeToggle } from "@/components/ThemeToggle";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

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

  function Shell({ action, status }: { action: React.ReactNode; status?: React.ReactNode }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          {action}
        </div>
        {status}
      </div>
    );
  }

  if (!isConnected) {
    if (hasInjectedProvider === null) {
      return <Shell action={<div style={{ width: 130, height: 38 }} aria-hidden="true" />} />;
    }

    if (!hasInjectedProvider) {
      return (
        <Shell
          action={
            <button onClick={openInMetaMask} style={btn.primary}>
              Open in MetaMask
            </button>
          }
          status={
            <span style={{ fontSize: 10.5, color: "var(--fog-faint)" }}>
              No wallet detected in this browser
            </span>
          }
        />
      );
    }

    return (
      <Shell
        action={
          <button onClick={handleConnect} disabled={isPending} style={btn.primary}>
            {isPending ? "Opening wallet…" : "Connect wallet"}
          </button>
        }
        status={
          connectError ? (
            <span style={{ fontSize: 10.5, color: "var(--dispute)", maxWidth: 220, textAlign: "right" }}>
              {connectError}
            </span>
          ) : undefined
        }
      />
    );
  }

  if (onWrongNetwork) {
    return (
      <Shell
        action={
          <button onClick={() => switchChain({ chainId: monadTestnet.id })} style={btn.warn}>
            Switch to Monad testnet
          </button>
        }
        status={
          <StatusPill color="var(--held)" label={`Wrong network · ${shortenAddress(address)}`} />
        }
      />
    );
  }

  return (
    <Shell
      action={
        <button onClick={() => disconnect()} style={btn.ghost}>
          Disconnect
        </button>
      }
      status={<StatusPill color="var(--cleared)" label={shortenAddress(address)} />}
    />
  );
}

function StatusPill({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span className="mono" style={{ fontSize: 12.5, color }}>
        {label}
      </span>
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
  whiteSpace: "nowrap",
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
