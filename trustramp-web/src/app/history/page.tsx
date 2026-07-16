"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { TradeTicket } from "@/components/TradeTicket";
import { TiltCard } from "@/components/TiltCard";
import { FilterTabs, type TradeFilter } from "@/components/FilterTabs";
import { useTrades } from "@/lib/useTrades";

export default function HistoryPage() {
  const [filter, setFilter] = useState<TradeFilter>("all");
  const { address, all, active, completed, refetch, isLoading } = useTrades(0);
  const reduceMotion = useReducedMotion();

  const shown = useMemo(() => {
    if (filter === "active") return active;
    if (filter === "completed") return completed;
    return all;
  }, [filter, all, active, completed]);

  const counts = {
    all: all.length,
    active: active.length,
    completed: completed.length,
  };

  return (
    <>
      <SiteHeader />
      <main style={wrap}>
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/"
            className="mono"
            style={{ fontSize: 12, color: "var(--fog-faint)" }}
          >
            ← Back to dashboard
          </Link>
          <h1 style={h1}>Trade history</h1>
          <p style={{ fontSize: 14, color: "var(--fog-dim)", lineHeight: 1.6 }}>
            Every escrow this wallet has been part of, settled or in flight.
          </p>
        </div>

        {/* Pairs with the dashboard's history button so the box stretches out
            into this page's surface instead of the view cutting to black. */}
        <motion.div
          layoutId="history-surface"
          transition={{ type: "spring", stiffness: 300, damping: 34 }}
          style={surface}
        >
          <div style={{ marginBottom: 18 }}>
            <FilterTabs value={filter} onChange={setFilter} counts={counts} />
          </div>

          {!address ? (
            <Empty>Connect your wallet to see your trade history.</Empty>
          ) : isLoading ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div className="skeleton" style={{ height: 150, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 150, borderRadius: 14 }} />
            </div>
          ) : shown.length === 0 ? (
            <Empty>Nothing here under this filter.</Empty>
          ) : (
            <motion.div layout style={{ display: "grid", gap: 14 }}>
              <AnimatePresence mode="popLayout" initial={true}>
                {shown.map(({ id, trade }, i) => (
                  <motion.div
                    key={id.toString()}
                    layout
                    initial={{ opacity: 0, y: -18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            // The cascade: each card is delayed a beat behind the
                            // one above it, so they deal out rather than pop in.
                            delay: i * 0.06,
                            type: "spring",
                            stiffness: 380,
                            damping: 28,
                          }
                    }
                  >
                    <TiltCard>
                      <TradeTicket id={id} trade={trade} onAction={() => refetch()} expandable />
                    </TiltCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </main>
    </>
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

const wrap: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "40px clamp(20px, 5vw, 48px) 80px",
};

const h1: React.CSSProperties = {
  fontSize: "clamp(26px, 4vw, 36px)",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  margin: "14px 0 10px",
};

const surface: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  borderRadius: 14,
  padding: "20px clamp(14px, 3vw, 22px)",
  background: "var(--slate)",
};
