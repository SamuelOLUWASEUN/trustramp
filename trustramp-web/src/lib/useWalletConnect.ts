"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";

export function useWalletConnect() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const [hasInjectedProvider, setHasInjectedProvider] = useState<boolean | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    setHasInjectedProvider(
      typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined"
    );
  }, []);

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];

  async function connectOrOpenMetaMask() {
    if (hasInjectedProvider === false) {
      const target = `${window.location.host}${window.location.pathname}`;
      window.location.href = `https://metamask.app.link/dapp/${target}`;
      return;
    }
    setConnectError(null);
    if (!injected) return;
    try {
      await connect({ connector: injected });
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect. Try again.");
    }
  }

  return {
    isConnected,
    hasInjectedProvider,
    isPending,
    connectError,
    connectOrOpenMetaMask,
  };
}
