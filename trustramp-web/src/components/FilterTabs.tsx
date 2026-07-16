"use client";

import { motion, useReducedMotion } from "framer-motion";

export type TradeFilter = "all" | "active" | "completed";

const TABS: { key: TradeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export function FilterTabs({
  value,
  onChange,
  counts,
}: {
  value: TradeFilter;
  onChange: (v: TradeFilter) => void;
  counts?: Record<TradeFilter, number>;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="filter-tabs" role="tablist" aria-label="Filter trades">
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            data-active={active}
            className="filter-tab"
            onClick={() => onChange(tab.key)}
          >
            {active && (
              // Same layoutId across all three tabs: Framer interpolates the pill's
              // position AND width between them, which is what produces the liquid
              // stretch rather than a jump.
              <motion.span
                layoutId="filter-pill"
                className="filter-pill"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 32 }
                }
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>
              {tab.label}
              {counts && counts[tab.key] > 0 && (
                <span style={{ marginLeft: 6, opacity: 0.55, fontSize: 11.5 }}>
                  {counts[tab.key]}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
