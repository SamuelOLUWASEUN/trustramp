"use client";

import { formatUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import {
  ESCROW_ADDRESS,
  escrowAbi,
  STATUS_META,
  TradeStatus,
  type TradeTuple,
} from "@/lib/contract";
import { shortenAddress, formatDeadline, tradeSerial } from "@/lib/format";
import { monadTestnet } from "@/lib/chains";

const TONE_COLOR: Record<string, string> = {
  held: "var(--held)",
  cleared: "var(--cleared)",
  dispute: "var(--dispute)",
  neutral: "var(--fog-dim)",
};

export function TradeTicket({
  id,
  trade,
  onAction,
}: {
  id: bigint;
  trade: TradeTuple;
  onAction?: () => void;
}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const status = trade.status as TradeStatus;
  const meta = STATUS_META[status] ?? STATUS_META[TradeStatus.None];
  const tone = TONE_COLOR[meta.tone];

  const isSender = address?.toLowerCase() === trade.sender.toLowerCase();
  const isReceiver = address?.toLowerCase() === trade.receiver.toLowerCase();
  const deadlinePassed = Date.now() / 1000 > Number(trade.confirmDeadline);

  async function call(fn: "confirmPayment" | "releaseFunds" | "refund" | "raiseDispute") {
    try {
      await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: fn,
        args: [id],
        chainId: monadTestnet.id,
      });
      onAction?.();
    } catch (err) {
      // Surface the revert reason to the user rather than swallowing it.
      console.error(err);
      alert(err instanceof Error ? err.message : "Transaction failed");
    }
  }

  // Which actions this wallet is allowed to take, given role + current status.
  const actions: { label: string; fn: Parameters<typeof call>[0]; tone: string }[] = [];
  if (status === TradeStatus.Created && isReceiver && !deadlinePassed) {
    actions.push({ label: "Confirm fiat sent", fn: "confirmPayment", tone: "var(--held)" });
  }
  if (status === TradeStatus.Created && isSender && deadlinePassed) {
    actions.push({ label: "Reclaim funds", fn: "refund", tone: "var(--fog-dim)" });
  }
  if (status === TradeStatus.PaymentConfirmed && isSender) {
    actions.push({ label: "Release funds", fn: "releaseFunds", tone: "var(--cleared)" });
  }
  if (
    (status === TradeStatus.Created || status === TradeStatus.PaymentConfirmed) &&
    (isSender || isReceiver)
  ) {
    actions.push({ label: "Raise dispute", fn: "raiseDispute", tone: "var(--dispute)" });
  }

  const amount = formatUnits(trade.amount, 6); // USDC-style 6 decimals

  return (
    <article style={ticket.root}>
      {/* Stub: serial + status stamp */}
      <div style={ticket.stub}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Trade
          </div>
          <div className="mono" style={{ fontSize: 15, letterSpacing: "0.04em" }}>
            {tradeSerial(id)}
          </div>
        </div>
        <div style={{ ...ticket.stamp, color: tone, borderColor: tone }}>{meta.label}</div>
      </div>

      {/* Perforation */}
      <div style={ticket.perf} aria-hidden="true" />

      {/* Body: route + amount */}
      <div style={ticket.body}>
        <div style={ticket.route}>
          <RoutePoint label="Sender" addr={trade.sender} highlight={isSender} />
          <div style={ticket.arrow}>
            <div style={ticket.arrowLine} />
            <span className="mono" style={ticket.arrowTag}>
              in escrow
            </span>
          </div>
          <RoutePoint label="Receiver" addr={trade.receiver} highlight={isReceiver} align="right" />
        </div>

        <div style={ticket.meta}>
          <div>
            <div className="eyebrow">Amount held</div>
            <div className="mono" style={{ fontSize: 20, marginTop: 4 }}>
              {amount} <span style={{ color: "var(--fog-dim)", fontSize: 13 }}>USDC</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow">Confirm window</div>
            <div className="mono" style={{ fontSize: 14, marginTop: 6, color: "var(--fog-dim)" }}>
              {status === TradeStatus.Created ? formatDeadline(trade.confirmDeadline) : "—"}
            </div>
          </div>
        </div>

        {actions.length > 0 && (
          <div style={ticket.actions}>
            {actions.map((a) => (
              <button
                key={a.fn}
                onClick={() => call(a.fn)}
                disabled={isPending}
                style={{
                  ...ticket.actionBtn,
                  borderColor: a.tone,
                  color: a.tone,
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function RoutePoint({
  label,
  addr,
  highlight,
  align = "left",
}: {
  label: string;
  addr: string;
  highlight?: boolean;
  align?: "left" | "right";
}) {
  return (
    <div style={{ textAlign: align, minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {label} {highlight && <span style={{ color: "var(--accent)" }}>· you</span>}
      </div>
      <div
        className="mono"
        style={{ fontSize: 13, color: highlight ? "var(--fog)" : "var(--fog-dim)" }}
      >
        {shortenAddress(addr)}
      </div>
    </div>
  );
}

const ticket = {
  root: {
    background: "var(--slate)",
    border: "1px solid var(--hairline)",
    borderRadius: 14,
    overflow: "hidden",
  } as React.CSSProperties,
  stub: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
  } as React.CSSProperties,
  stamp: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "5px 10px",
    border: "1px solid",
    borderRadius: 6,
  } as React.CSSProperties,
  perf: {
    height: 1,
    borderTop: "1px dashed var(--hairline-strong)",
    margin: "0 12px",
    position: "relative",
  } as React.CSSProperties,
  body: { padding: "18px 20px 20px" } as React.CSSProperties,
  route: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  } as React.CSSProperties,
  arrow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    minWidth: 72,
  } as React.CSSProperties,
  arrowLine: {
    width: "100%",
    height: 1,
    background:
      "repeating-linear-gradient(90deg, var(--hairline-strong) 0 6px, transparent 6px 10px)",
  } as React.CSSProperties,
  arrowTag: {
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--fog-faint)",
  } as React.CSSProperties,
  meta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 16,
    borderTop: "1px solid var(--hairline)",
  } as React.CSSProperties,
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  } as React.CSSProperties,
  actionBtn: {
    height: 36,
    padding: "0 14px",
    background: "transparent",
    border: "1px solid",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
};
