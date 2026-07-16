"use client";

import { motion } from "framer-motion";

const COLORS = ["var(--cleared)", "var(--accent)", "var(--held)"];

// Deterministic spread rather than Math.random(): random values would differ
// between renders and there's no reason for the burst to be unpredictable.
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return {
    id: i,
    x: Math.cos(angle) * (54 + (i % 3) * 16),
    y: Math.sin(angle) * (34 + (i % 4) * 10),
    color: COLORS[i % COLORS.length],
    size: 4 + (i % 3),
  };
});

export function ConfettiBurst() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 3,
      }}
      aria-hidden="true"
    >
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x,
            // Slight downward bias on the way out so it falls rather than
            // hanging in the air.
            y: p.y + 26,
            opacity: 0,
            scale: 0.4,
          }}
          transition={{ duration: 0.85, ease: [0.2, 0.7, 0.35, 1] }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: 1.5,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
