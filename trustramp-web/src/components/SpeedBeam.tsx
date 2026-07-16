"use client";

import { useEffect, useState } from "react";

export type BeamPhase = "idle" | "signing" | "broadcasting";

/**
 * Wraps a card and traces a light around its border while a tx is in flight.
 * The parent must be position:relative with a border-radius for this to sit
 * correctly — it inherits the radius.
 *
 * `signing`      → waiting on the user's wallet, slow orbit
 * `broadcasting` → submitted, waiting on Monad, fast orbit
 * back to idle   → one settling ripple
 */
export function SpeedBeam({ phase }: { phase: BeamPhase }) {
  const [settling, setSettling] = useState(false);
  const [wasActive, setWasActive] = useState(false);

  const active = phase !== "idle";

  useEffect(() => {
    if (active) {
      setWasActive(true);
      return;
    }
    if (!wasActive) return;
    // Went active → idle: play the ripple once, then clear it.
    setSettling(true);
    setWasActive(false);
    const t = setTimeout(() => setSettling(false), 700);
    return () => clearTimeout(t);
  }, [active, wasActive]);

  if (!active && !settling) return null;

  if (settling) {
    return (
      <div
        className="beam beam-settled"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="beam" data-phase={phase === "broadcasting" ? "fast" : "slow"} aria-hidden="true">
      <div className="beam-rotor" />
      <div className="beam-mask" />
    </div>
  );
}
