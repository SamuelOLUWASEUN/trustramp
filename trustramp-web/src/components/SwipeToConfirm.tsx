"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";

const KEY_SIZE = 42;
const TRACK_H = 50;
const COMPLETE_AT = 0.92; // fraction of travel that counts as a commit

export function SwipeToConfirm({
  label,
  onConfirm,
  disabled,
  busy,
  busyLabel = "Confirming…",
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);
  const [armed, setArmed] = useState(false);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);

  // Measure the travel distance, and keep it correct if the card reflows.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setMaxX(Math.max(0, el.offsetWidth - KEY_SIZE - 8));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const progress = useTransform(x, [0, maxX || 1], [0, 1]);
  const fillWidth = useTransform(progress, (p) => `${p * 100}%`);
  const labelOpacity = useTransform(progress, [0, 0.55], [1, 0]);

  function handleDragEnd() {
    if (maxX === 0) return;
    const p = x.get() / maxX;
    if (p >= COMPLETE_AT) {
      // Committed: snap to the end, buzz, and fire.
      animate(x, maxX, { type: "spring", stiffness: 500, damping: 30 });
      setArmed(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(18);
      }
      onConfirm();
    } else {
      // Let go early: elastic recoil back to the start.
      animate(x, 0, { type: "spring", stiffness: 420, damping: 14 });
    }
  }

  // Reduced motion (or no measurable track yet): fall back to a plain button so
  // the action is never unreachable.
  if (reduceMotion) {
    return (
      <button
        onClick={onConfirm}
        disabled={disabled || busy}
        style={{
          width: "100%",
          height: TRACK_H,
          borderRadius: 12,
          border: "1px solid var(--cleared)",
          background: "transparent",
          color: "var(--cleared)",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {busy ? busyLabel : label}
      </button>
    );
  }

  return (
    <div
      ref={trackRef}
      style={{
        position: "relative",
        height: TRACK_H,
        borderRadius: 12,
        border: "1px solid var(--hairline-strong)",
        background: "var(--input-bg)",
        overflow: "hidden",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled || busy ? "none" : "auto",
        touchAction: "pan-y",
      }}
    >
      {/* Liquid fill trailing the key */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          width: fillWidth,
          background:
            "linear-gradient(90deg, rgba(52,211,153,0.10), rgba(52,211,153,0.34))",
          pointerEvents: "none",
        }}
      />

      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13.5,
          fontWeight: 500,
          color: "var(--fog-dim)",
          opacity: busy ? 1 : labelOpacity,
          pointerEvents: "none",
        }}
      >
        {busy ? busyLabel : armed ? "Confirmed" : label}
      </motion.span>

      {!busy && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxX }}
          dragElastic={0.04}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{
            x,
            position: "absolute",
            top: 4,
            left: 4,
            width: KEY_SIZE,
            height: KEY_SIZE,
            borderRadius: 9,
            background: "var(--slate-2)",
            border: "1px solid var(--cleared)",
            boxShadow: "0 0 14px -4px var(--cleared)",
            color: "var(--cleared)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            touchAction: "none",
          }}
          whileDrag={{ cursor: "grabbing", scale: 1.04 }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }} aria-hidden="true">
            →
          </span>
        </motion.div>
      )}
    </div>
  );
}
