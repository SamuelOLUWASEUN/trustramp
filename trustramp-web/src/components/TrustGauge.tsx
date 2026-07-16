"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const SWEEP = 180; // degrees, -90 (left) … +90 (right)

/**
 * Score is derived from real on-chain counts, not a vibe:
 *   clean trades push it up, disputes hurt hardest, refunds (counterparty
 *   flaked or went silent) hurt less but still count.
 * An address with no history scores 0 and is reported as unknown, not "bad" —
 * a new wallet isn't evidence of dishonesty.
 */
export function trustScore(completed: number, disputed: number, refunded: number) {
  const total = completed + disputed + refunded;
  if (total === 0) return 0;
  const good = completed;
  const bad = disputed * 1.5 + refunded * 0.6;
  const raw = (good - bad) / total; // -1.5 … 1
  return Math.max(0, Math.min(1, (raw + 1) / 2)); // normalise to 0 … 1
}

export function TrustGauge({
  score,
  total,
}: {
  score: number; // 0 … 1
  total: number;
}) {
  const reduceMotion = useReducedMotion();
  const target = useMotionValue(0);

  // Low damping is the whole point: the needle overshoots and settles back,
  // like a tachometer on a throttle blip.
  const spring = useSpring(target, {
    stiffness: 110,
    damping: reduceMotion ? 40 : 9,
    mass: 0.9,
  });

  const rotate = useTransform(spring, [0, 1], [-SWEEP / 2, SWEEP / 2]);

  useEffect(() => {
    // Small delay so the sweep reads as a reaction to the lookup, not a static render.
    const t = setTimeout(() => target.set(score), 90);
    return () => clearTimeout(t);
  }, [score, target]);

  const verdict =
    total === 0
      ? { label: "No history", color: "var(--held)" }
      : score >= 0.75
        ? { label: "Trusted", color: "var(--cleared)" }
        : score >= 0.45
          ? { label: "Mixed", color: "var(--held)" }
          : { label: "Risky", color: "var(--dispute)" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 108, height: 60, flexShrink: 0 }}>
        <svg viewBox="0 0 108 60" width="108" height="60" aria-hidden="true">
          {/* Track: risky → mixed → trusted, left to right */}
          <path
            d="M 10 56 A 44 44 0 0 1 98 56"
            fill="none"
            stroke="var(--hairline-strong)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 10 56 A 44 44 0 0 1 34 19"
            fill="none"
            stroke="var(--dispute)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M 74 19 A 44 44 0 0 1 98 56"
            fill="none"
            stroke="var(--cleared)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>

        {/* Needle pivots from the gauge's centre-bottom */}
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 4,
            width: 2.5,
            height: 40,
            borderRadius: 2,
            background: verdict.color,
            transformOrigin: "50% 100%",
            rotate,
            x: "-50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: verdict.color,
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: verdict.color }}>
          {verdict.label}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fog-faint)", marginTop: 3 }}>
          {total === 0
            ? "Nothing on-chain yet — start small"
            : `${total} trade${total === 1 ? "" : "s"} on record`}
        </div>
      </div>
    </div>
  );
}
