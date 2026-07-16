"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const MAX_TILT = 6; // degrees — subtle. Past ~8 it reads as a gimmick.

export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Normalised pointer position within the card, -0.5 … 0.5 on each axis.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Springs so the tilt settles rather than tracking the cursor rigidly.
  const sx = useSpring(px, { stiffness: 260, damping: 18 });
  const sy = useSpring(py, { stiffness: 260, damping: 18 });

  // Pointer right → tips right edge away; pointer down → tips bottom away.
  const rotateY = useTransform(sx, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
    // Drive the glare from the same pointer position.
    el.style.setProperty("--glare-x", `${nx * 100}%`);
    el.style.setProperty("--glare-y", `${ny * 100}%`);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  if (reduceMotion) {
    return <div style={{ position: "relative" }}>{children}</div>;
  }

  return (
    // Perspective lives on the parent so the child rotates in real 3D space
    // rather than getting a flat, skewed look.
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        className="tilt-card"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, position: "relative", borderRadius: 14 }}
      >
        {children}
        <div className="tilt-glare" />
      </motion.div>
    </div>
  );
}
