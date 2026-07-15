"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi, type TradeTuple } from "@/lib/contract";
import { TradeTicket } from "./TradeTicket";

export function TradeList({ refreshKey }: { refreshKey: number }) {
  const { address } = useAccount();

  const { data: nextId } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "nextTradeId",
    query: { refetchInterval: 8000 },
    scopeKey: `next-${refreshKey}`,
  });

  const ids = useMemo(() => {
    if (!nextId) return [];
    const total = Number(nextId) - 1;
    return Array.from({ length: total }, (_, i) => BigInt(i + 1));
  }, [nextId]);

  const { data: tradesData, refetch } = useReadContracts({
    contracts: ids.map((id) => ({
      address: ESCROW_ADDRESS,
      abi: escrowAbi,
      functionName: "getTrade",
      args: [id],
    })),
    query: { enabled: ids.length > 0 },
    scopeKey: `trades-${refreshKey}-${ids.length}`,
  });

  const mine = useMemo(() => {
    if (!tradesData || !address) return [];
    const lower = address.toLowerCase();
    return ids
      .map((id, i) => ({ id, trade: tradesData[i]?.result as TradeTuple | undefined }))
      .filter(
        (t): t is { id: bigint; trade: TradeTuple } =>
          !!t.trade &&
          (t.trade.sender.toLowerCase() === lower ||
            t.trade.receiver.toLowerCase() === lower)
      )
      .reverse();
  }, [tradesData, ids, address]);

  if (!address) {
    return <Empty>Connect your wallet to see trades you&apos;re part of.</Empty>;
  }

  if (mine.length === 0) {
    return <Empty>No trades yet. Lock funds above to start your first one.</Empty>;
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {mine.map(({ id, trade }) => (
        <TradeTicket key={id.toString()} id={id} trade={trade} onAction={() => refetch()} />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px dashed var(--hairline-strong)",
        borderRadius: 14,
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--fog-faint)",
        fontSize: 13.5,
      }}
    >
      {children}
    </div>
  );
}
