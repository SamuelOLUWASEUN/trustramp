"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

// High stiffness starts the animation almost instantly; medium damping lets it
// overshoot a touch and settle with a small wobble, which is what reads as
// "tactile" rather than a flat CSS scale.
const spring = { type: "spring" as const, stiffness: 400, damping: 15 };

export function MotionButton({ className, disabled, ...props }: HTMLMotionProps<"button">) {
  const reduceMotion = useReducedMotion();

  // Skip the squish when the OS asks for reduced motion, and when the button is
  // disabled — springing a dead button implies it did something.
  const animate = !reduceMotion && !disabled;

  return (
    <motion.button
      className={`motion-btn${className ? ` ${className}` : ""}`}
      disabled={disabled}
      whileHover={animate ? { scale: 1.02 } : undefined}
      whileTap={animate ? { scale: 0.98 } : undefined}
      transition={spring}
      {...props}
    />
  );
}
