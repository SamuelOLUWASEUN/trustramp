"use client";

import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/chains";
import { shortenAddress } from "@/lib/format";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Spinner } from "@/components/Spinner";
import { WalletIcon } from "@/components/WalletIcon";
import { useWalletConnect } from "@/lib/useWalletConnect";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { hasInjectedProvider, isPending, connectError, connectOrOpenMetaMask } =
    useWalletConnect();

  const onWrongNetwork = isConnected && chainId !== monadTestnet.id;

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
      return <Shell action={<div style={{ width: 38, height: 38 }} aria-hidden="true" />} />;
    }

    // Icon-only on purpose: the amber banner and the in-card blocker button both
    // carry the written call to action, so the header stays weightless.
    return (
      <Shell
        action={
          <button
            onClick={connectOrOpenMetaMask}
            disabled={isPending}
            style={btn.icon}
            aria-label={hasInjectedProvider ? "Connect wallet" : "Open in MetaMask"}
            title={hasInjectedProvider ? "Connect wallet" : "Open in MetaMask"}
          >
            {isPending ? <Spinner /> : <WalletIcon />}
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
};

const btn = {
  // Borderless, background-free icon button — same weightless footprint as the
  // theme toggle so the two sit on one clean line.
  icon: {
    width: 38,
    height: 38,
    padding: 0,
    background: "transparent",
    border: "none",
    borderRadius: 8,
    color: "var(--fog-dim)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  // Kept bordered on purpose: this is an alert state, not a utility. It needs to
  // read as something you must act on, not blend into the chrome.
  warn: {
    ...base,
    background: "transparent",
    borderColor: "var(--held)",
    color: "var(--held)",
  } as React.CSSProperties,
  ghost: {
    ...base,
    padding: "0 4px",
    background: "transparent",
    border: "none",
    color: "var(--fog-faint)",
    fontSize: 13,
  } as React.CSSProperties,
};
