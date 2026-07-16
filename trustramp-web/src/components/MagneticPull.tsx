"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

// How far outside the element's bounds the pull starts, and how much of the
// cursor's offset the element actually travels. Kept low so the button never
// wanders far enough to feel like it's dodging you.
const RADIUS = 30;
const PULL = 0.22;

export function MagneticPull({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // Stiff + fairly damped reads as "heavy metal snapping into place" rather than
  // a floaty drift.
  const x = useSpring(mx, { stiffness: 320, damping: 22, mass: 0.6 });
  const y = useSpring(my, { stiffness: 320, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduceMotion) return;
    // Pointer-only: there's no hover on touch, so there's nothing to be magnetic to.
    if (window.matchMedia("(hover: none)").matches) return;

    function onMove(e: PointerEvent) {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      // Distance from the element's edges, not its centre — so a wide button
      // isn't "far away" just because you're near its end.
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);

      if (Math.hypot(dx, dy) <= RADIUS) {
        mx.set((e.clientX - cx) * PULL);
        my.set((e.clientY - cy) * PULL);
      } else {
        mx.set(0);
        my.set(0);
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduceMotion]);

  if (reduceMotion) return <div ref={ref}>{children}</div>;

  return (
    <motion.div ref={ref} style={{ x, y }}>
      {children}
    </motion.div>
  );
}
