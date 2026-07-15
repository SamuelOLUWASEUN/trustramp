"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi, type TradeTuple } from "@/lib/contract";
import { TradeTicket } from "./TradeTicket";

export function TradeList({ refreshKey }: { refreshKey: number }) {
  const { address } = useAccount();

  const { data: nextId, isLoading: nextIdLoading } = useReadContract({
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

  const {
    data: tradesData,
    refetch,
    isLoading: tradesLoading,
  } = useReadContracts({
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

  // Still resolving nextTradeId, or resolving the individual trades once we know
  // there are some — show skeletons instead of briefly flashing "No trades yet."
  const stillLoading = nextIdLoading || (ids.length > 0 && tradesLoading);
  if (stillLoading) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <TicketSkeleton />
      </div>
    );
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

function TicketSkeleton() {
  return (
    <div
      style={{
        background: "var(--slate)",
        border: "1px solid var(--hairline)",
        borderRadius: 14,
        padding: "18px 20px",
      }}
      aria-hidden="true"
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
        <div className="skeleton" style={{ width: 90, height: 14 }} />
        <div className="skeleton" style={{ width: 100, height: 22, borderRadius: 6 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 70, height: 30 }} />
        <div className="skeleton" style={{ width: 70, height: 30 }} />
      </div>
      <div className="skeleton" style={{ width: "100%", height: 36, borderRadius: 8 }} />
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
