import type { Address } from "viem";

export function shortenAddress(addr?: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatDeadline(deadline: bigint): string {
  const ms = Number(deadline) * 1000;
  const now = Date.now();
  const diff = ms - now;
  if (diff <= 0) return "window closed";
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  return `${hours}h ${mins}m left`;
}

export function isAddressLike(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

// A trade reference styled like a ticket serial: TR-000042
export function tradeSerial(id: bigint | number): string {
  return `TR-${String(id).padStart(6, "0")}`;
}
