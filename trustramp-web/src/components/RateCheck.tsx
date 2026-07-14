"use client";

import { useEffect, useState } from "react";

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

  return (
    <section style={card.root}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        Rate check · USD → NGN
      </div>

      <div style={card.grid}>
        <div>
          <div style={card.smallLabel}>Mid-market rate</div>
          <div className="mono" style={card.bigNum}>
            {mid.status === "ready"
              ? `₦${mid.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : mid.status === "loading"
                ? "…"
                : "unavailable"}
          </div>
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
              onChange={(e) => setOffered(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="1450"
              style={card.input}
              className="mono"
            />
          </div>
        </div>
      </div>

      <div style={card.verdict}>
        {spreadPct === null ? (
          <span style={{ color: "var(--fog-faint)" }}>
            {mid.status === "error"
              ? "Live rate unavailable — enter both sides manually to compare."
              : "Enter an offered rate to see how it compares."}
          </span>
        ) : spreadPct > 3 ? (
          <span style={{ color: "var(--dispute)" }}>
            You&apos;re being offered {spreadPct.toFixed(1)}% below mid-market. That&apos;s a wide
            spread — push back or shop around.
          </span>
        ) : spreadPct < -1 ? (
          <span style={{ color: "var(--cleared)" }}>
            This rate beats mid-market. Looks good.
          </span>
        ) : (
          <span style={{ color: "var(--cleared)" }}>
            Within {Math.abs(spreadPct).toFixed(1)}% of mid-market — a fair rate.
          </span>
        )}
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
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
    background: "var(--void)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 8,
    color: "var(--fog)",
    padding: "0 10px",
    fontSize: 16,
  } as React.CSSProperties,
  verdict: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid var(--hairline)",
    fontSize: 13,
    lineHeight: 1.5,
  } as React.CSSProperties,
};
