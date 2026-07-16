"use client";

import { useEffect, useState } from "react";
import { sanitizeDecimalInput } from "@/lib/format";
import { AnimatePresence, motion } from "framer-motion";

type RateState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rate: number; fetchedAt: number };

// Public FX endpoint, no key required. If it's down, the widget degrades to a
// manual-entry state rather than blocking the user or showing a fake number.
const FX_URL = "https://open.er-api.com/v6/latest/USD";

export function RateCheck() {
  const [mid, setMid] = useState<RateState>({ status: "loading" });
  const [offered, setOffered] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(FX_URL);
        const data = await res.json();
        const ngn = data?.rates?.NGN;
        if (!cancelled && typeof ngn === "number") {
          setMid({ status: "ready", rate: ngn, fetchedAt: Date.now() });
        } else if (!cancelled) {
          setMid({ status: "error" });
        }
      } catch {
        if (!cancelled) setMid({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const offeredNum = parseFloat(offered);
  const hasComparison =
    mid.status === "ready" && !Number.isNaN(offeredNum) && offeredNum > 0;
  const spreadPct = hasComparison
    ? ((mid.rate - offeredNum) / mid.rate) * 100
    : null;

  // One source of truth for the copy AND the aura, so the glow can never
  // disagree with the words next to it.
  const verdict: {
    key: string;
    text: string;
    color: string;
    glow: string | null;
    pulse: boolean;
  } =
    spreadPct === null
      ? {
          key: "idle",
          text:
            mid.status === "error"
              ? "Live rate unavailable — enter both sides manually to compare."
              : "Enter an offered rate to see how it compares.",
          color: "var(--fog-faint)",
          glow: null,
          pulse: false,
        }
      : spreadPct > 8
        ? {
            key: "bad",
            text: `You're being offered ${spreadPct.toFixed(1)}% below mid-market. That's a serious spread — walk away or push back hard.`,
            color: "var(--dispute)",
            glow: "rgba(248, 113, 113, 0.42)",
            pulse: true,
          }
        : spreadPct > 3
          ? {
              key: "warn",
              text: `You're being offered ${spreadPct.toFixed(1)}% below mid-market. That's a wide spread — push back or shop around.`,
              color: "var(--dispute)",
              glow: "rgba(248, 113, 113, 0.26)",
              pulse: true,
            }
          : spreadPct < -1
            ? {
                key: "great",
                text: "This rate beats mid-market. Looks good.",
                color: "var(--cleared)",
                glow: "rgba(52, 211, 153, 0.34)",
                pulse: false,
              }
            : {
                key: "fair",
                text: `Within ${Math.abs(spreadPct).toFixed(1)}% of mid-market — a fair rate.`,
                color: "var(--cleared)",
                glow: "rgba(251, 191, 36, 0.24)",
                pulse: false,
              };

  return (
    <section style={{ ...card.root, position: "relative" }}>
      <div
        className="rate-aura"
        data-pulse={verdict.pulse}
        style={{ boxShadow: verdict.glow ? `0 0 26px 2px ${verdict.glow}` : "none" }}
        aria-hidden="true"
      />
      <div className="eyebrow" style={{ marginBottom: 14, position: "relative" }}>
        Rate check · USD → NGN
      </div>

      <div className="rate-fields">
        <div>
          <div style={card.smallLabel}>Mid-market rate</div>
          {mid.status === "loading" ? (
            <div className="skeleton" style={{ width: 110, height: 26, marginTop: 2 }} />
          ) : (
            <div className="mono" style={card.bigNum}>
              {mid.status === "ready"
                ? `₦${mid.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : "unavailable"}
            </div>
          )}
        </div>

        <div>
          <div style={card.smallLabel}>Rate you were offered</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="mono" style={{ color: "var(--fog-dim)", fontSize: 18 }}>
              ₦
            </span>
            <input
              inputMode="decimal"
              value={offered}
              onChange={(e) => setOffered(sanitizeDecimalInput(e.target.value))}
              placeholder="1450"
              style={card.input}
              className="mono"
            />
          </div>
        </div>
      </div>

      <div style={{ ...card.verdict, position: "relative", minHeight: 38, overflow: "hidden" }}>
        {/* mode="wait" so the outgoing line clears before the new one arrives —
            crossfading two different warnings would be unreadable. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={verdict.key}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{ color: verdict.color, margin: 0 }}
          >
            {verdict.text}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}

const card = {
  root: {
    background: "var(--slate)",
    border: "1px solid var(--hairline)",
    borderRadius: 14,
    padding: "20px 22px",
  } as React.CSSProperties,
  smallLabel: {
    fontSize: 12,
    color: "var(--fog-dim)",
    marginBottom: 8,
  } as React.CSSProperties,
  bigNum: { fontSize: 22 } as React.CSSProperties,
  input: {
    width: "100%",
    height: 34,
    background: "var(--input-bg)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 8,
    color: "var(--fog)",
    padding: "0 10px",
    fontSize: 16,
    minWidth: 0,
  } as React.CSSProperties,
  verdict: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid var(--hairline)",
    fontSize: 13,
    lineHeight: 1.5,
  } as React.CSSProperties,
};
