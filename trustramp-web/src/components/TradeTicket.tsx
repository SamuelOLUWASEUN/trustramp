"use client";

import { MotionButton } from "@/components/MotionButton";
import { useState } from "react";
import { formatUnits } from "viem";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import {
  ESCROW_ADDRESS,
  escrowAbi,
  STATUS_META,
  TradeStatus,
  type TradeTuple,
} from "@/lib/contract";
import { shortenAddress, formatDeadline, tradeSerial, formatTimestamp } from "@/lib/format";
import { monadTestnet } from "@/lib/chains";
import { config } from "@/lib/wagmi";
import { Spinner } from "@/components/Spinner";
import { SwipeToConfirm } from "@/components/SwipeToConfirm";
import { EscrowTimeline } from "@/components/EscrowTimeline";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { SpeedBeam, type BeamPhase } from "@/components/SpeedBeam";

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
  expandable = false,
}: {
  id: bigint;
  trade: TradeTuple;
  onAction?: () => void;
  expandable?: boolean;
}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const status = trade.status as TradeStatus;
  const meta = STATUS_META[status] ?? STATUS_META[TradeStatus.None];
  const tone = TONE_COLOR[meta.tone];

  // Only in-flight trades breathe. A settled trade sitting there pulsing would
  // imply it still wants something from you.
  const breathing =
    status === TradeStatus.Created ||
    status === TradeStatus.PaymentConfirmed ||
    status === TradeStatus.Disputed;

  const isSender = address?.toLowerCase() === trade.sender.toLowerCase();
  const isReceiver = address?.toLowerCase() === trade.receiver.toLowerCase();
  const deadlinePassed = Date.now() / 1000 > Number(trade.confirmDeadline);

  async function call(fn: "confirmPayment" | "releaseFunds" | "refund" | "raiseDispute") {
    try {
      const hash = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: fn,
        args: [id],
        chainId: monadTestnet.id,
      });
      // writeContractAsync resolves once the tx is *submitted*, not once it's mined.
      // Refreshing immediately after that can still show stale status if the block
      // hasn't landed yet — so wait for the actual receipt first.
      setConfirming(true);
      await waitForTransactionReceipt(config, { hash, chainId: monadTestnet.id });
      if (fn === "releaseFunds") {
        // Let the flip + burst play before the list refetches and animates the
        // card away, otherwise the celebration is cut off by the collapse.
        setCelebrating(true);
        await new Promise((r) => setTimeout(r, 900));
      }
      onAction?.();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setConfirming(false);
    }
  }

  // Releasing funds is the one irreversible, high-stakes action here, so it does
  // NOT get a plain button — it's gated behind the swipe slider below.
  const canRelease = status === TradeStatus.PaymentConfirmed && isSender;

  // Which actions this wallet is allowed to take, given role + current status.
  const actions: { label: string; fn: Parameters<typeof call>[0]; tone: string }[] = [];
  if (status === TradeStatus.Created && isReceiver && !deadlinePassed) {
    actions.push({ label: "Confirm fiat sent", fn: "confirmPayment", tone: "var(--held)" });
  }
  if (status === TradeStatus.Created && isSender && deadlinePassed) {
    actions.push({ label: "Reclaim funds", fn: "refund", tone: "var(--fog-dim)" });
  }
  if (
    (status === TradeStatus.Created || status === TradeStatus.PaymentConfirmed) &&
    (isSender || isReceiver)
  ) {
    actions.push({ label: "Raise dispute", fn: "raiseDispute", tone: "var(--dispute)" });
  }

  const amount = formatUnits(trade.amount, 6); // USDC-style 6 decimals

  return (
    <motion.article
      className={breathing ? "card-breathing" : undefined}
      style={{ ...ticket.root, position: "relative", transformStyle: "preserve-3d" }}
      animate={celebrating ? { rotateY: [0, 8, -4, 0], scale: [1, 1.015, 1] } : {}}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <SpeedBeam phase={isPending ? "signing" : confirming ? "broadcasting" : "idle"} />
      {celebrating && <ConfettiBurst />}
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
        <div
          className={breathing ? "badge-breathing" : undefined}
          style={{ ...ticket.stamp, color: tone, borderColor: tone }}
        >
          {meta.label}
        </div>
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

        {canRelease && (
          <div style={{ marginTop: 16 }}>
            <SwipeToConfirm
              label="Slide to release funds"
              busyLabel={celebrating ? "Released" : "Releasing…"}
              busy={confirming || isPending || celebrating}
              onConfirm={() => call("releaseFunds")}
            />
            <p style={{ fontSize: 11, color: "var(--fog-faint)", marginTop: 8, lineHeight: 1.5 }}>
              Only slide once you&apos;ve confirmed the naira actually landed. This pays out
              immediately and can&apos;t be undone.
            </p>
          </div>
        )}

        {actions.length > 0 && (
          <div style={ticket.actions}>
            {actions.map((a) => (
              <MotionButton
                key={a.fn}
                onClick={() => call(a.fn)}
                disabled={isPending || confirming}
                style={{
                  ...ticket.actionBtn,
                  borderColor: a.tone,
                  color: a.tone,
                  opacity: isPending || confirming ? 0.5 : 1,
                }}
              >
                {confirming ? (
                  <>
                    <Spinner /> Confirming on-chain…
                  </>
                ) : (
                  a.label
                )}
              </MotionButton>
            ))}
          </div>
        )}
        {expandable && (
          <>
            <MotionButton
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              style={ticket.expandBtn}
            >
              <span>{expanded ? "Hide details" : "Details"}</span>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                style={{ display: "inline-flex", fontSize: 10 }}
                aria-hidden="true"
              >
                ▾
              </motion.span>
            </MotionButton>

            <AnimatePresence initial={false}>
              {expanded && (
                // Animating height (not just opacity) is what pushes the cards
                // below down with the spring rather than letting them jump.
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { type: "spring", stiffness: 320, damping: 30 },
                    opacity: { duration: 0.18 },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <EscrowTimeline status={status} />
                  <motion.dl
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.06, duration: 0.22 }}
                    style={ticket.details}
                  >
                    <Detail label="Opened" value={formatTimestamp(trade.createdAt)} />
                    <Detail
                      label="Confirm deadline"
                      value={formatTimestamp(trade.confirmDeadline)}
                    />
                    <Detail label="Route" value={`${shortenAddress(trade.sender)} → ${shortenAddress(trade.receiver)}`} />
                    <Detail label="Token" value={shortenAddress(trade.token)} />
                    <Detail label="Escrow" value={shortenAddress(ESCROW_ADDRESS)} />
                    <Detail
                      label="Explorer"
                      value={
                        <a
                          href={`${monadTestnet.blockExplorers.default.url}/address/${ESCROW_ADDRESS}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--accent)" }}
                        >
                          View contract ↗
                        </a>
                      }
                    />
                  </motion.dl>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.article>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <dt style={{ fontSize: 12, color: "var(--fog-faint)" }}>{label}</dt>
      <dd className="mono" style={{ fontSize: 12, color: "var(--fog-dim)", textAlign: "right" }}>
        {value}
      </dd>
    </div>
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
  expandBtn: {
    marginTop: 14,
    width: "100%",
    height: 34,
    background: "transparent",
    border: "1px dashed var(--hairline-strong)",
    borderRadius: 8,
    color: "var(--fog-dim)",
    fontSize: 12.5,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  } as React.CSSProperties,
  details: {
    display: "grid",
    gap: 9,
    marginTop: 14,
    paddingTop: 14,
    borderTop: "1px solid var(--hairline)",
  } as React.CSSProperties,
  actionBtn: {
    height: 36,
    padding: "0 14px",
    background: "transparent",
    border: "1px solid",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 6,
  } as React.CSSProperties,
};
