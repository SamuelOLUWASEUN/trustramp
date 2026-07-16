"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi, TradeStatus, type TradeTuple } from "@/lib/contract";

export type TradeEntry = { id: bigint; trade: TradeTuple };

// Statuses where the trade is still in flight and needs someone to act.
export const ACTIVE_STATUSES = [
  TradeStatus.Created,
  TradeStatus.PaymentConfirmed,
  TradeStatus.Disputed,
];

export function isActive(trade: TradeTuple) {
  return ACTIVE_STATUSES.includes(trade.status as TradeStatus);
}

export function useTrades(refreshKey = 0) {
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

  const mine = useMemo<TradeEntry[]>(() => {
    if (!tradesData || !address) return [];
    const lower = address.toLowerCase();
    return ids
      .map((id, i) => ({ id, trade: tradesData[i]?.result as TradeTuple | undefined }))
      .filter(
        (t): t is TradeEntry =>
          !!t.trade &&
          (t.trade.sender.toLowerCase() === lower || t.trade.receiver.toLowerCase() === lower)
      )
      .reverse();
  }, [tradesData, ids, address]);

  const active = useMemo(() => mine.filter((t) => isActive(t.trade)), [mine]);
  const completed = useMemo(() => mine.filter((t) => !isActive(t.trade)), [mine]);

  return {
    address,
    all: mine,
    active,
    completed,
    refetch,
    isLoading: nextIdLoading || (ids.length > 0 && tradesLoading),
  };
}
