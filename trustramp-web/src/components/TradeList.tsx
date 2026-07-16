"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TradeTicket } from "./TradeTicket";
import { useTrades } from "@/lib/useTrades";

export function TradeList({ refreshKey }: { refreshKey: number }) {
  const { address, active, completed, refetch, isLoading } = useTrades(refreshKey);
  const reduceMotion = useReducedMotion();

  if (!address) {
    return <Empty>Connect your wallet to see trades you&apos;re part of.</Empty>;
  }

  if (isLoading) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <TicketSkeleton />
      </div>
    );
  }

  const hasHistory = completed.length > 0;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* AnimatePresence + a keyed height animation is what lets the last card
          collapse away instead of vanishing, with the zero-state fading up
          into the space it leaves behind. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {active.map(({ id, trade }) => (
          <motion.div
            key={id.toString()}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, marginBottom: -14, scaleY: 0.9 }
            }
            transition={{
              layout: { type: "spring", stiffness: 320, damping: 30 },
              default: { duration: 0.28 },
            }}
            style={{ overflow: "hidden", transformOrigin: "top" }}
          >
            <TradeTicket id={id} trade={trade} onAction={() => refetch()} />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {active.length === 0 && (
          <motion.div
            key="zero"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: active.length === 0 ? 0.12 : 0 }}
          >
            <Empty>
              {hasHistory
                ? "No active escrows. Everything's settled."
                : "No trades yet. Lock funds above to start your first one."}
            </Empty>
          </motion.div>
        )}
      </AnimatePresence>

      {hasHistory && (
        <motion.div layout>
          <Link href="/history" style={{ display: "block" }}>
            {/* layoutId pairs this with the history page's grid wrapper, so the
                button's box stretches out into the page rather than cutting. */}
            <motion.div
              layoutId="history-surface"
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--slate)",
                fontSize: 13.5,
                color: "var(--fog-dim)",
              }}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <span>View full trade history</span>
              <span className="mono" style={{ color: "var(--fog-faint)" }}>
                {completed.length} settled →
              </span>
            </motion.div>
          </Link>
        </motion.div>
      )}
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
