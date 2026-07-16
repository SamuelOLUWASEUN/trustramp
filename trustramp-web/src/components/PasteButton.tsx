"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { isAddressLike } from "@/lib/format";

const MAGNET_RADIUS = 26;
const MAGNET_PULL = 0.3;
const ASSEMBLE_MS = 260;

export function PasteButton({ onPaste }: { onPaste: (text: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const [clipboardReady, setClipboardReady] = useState(false);
  const [assembling, setAssembling] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 400, damping: 20, mass: 0.4 });
  const y = useSpring(my, { stiffness: 400, damping: 20, mass: 0.4 });

  // Clipboard awareness, done honestly.
  //
  // Browsers deliberately forbid silently reading the clipboard — otherwise any
  // page could harvest whatever you last copied. We only ever peek if the
  // browser reports clipboard-read as already GRANTED (Chromium-only, and only
  // if the user previously allowed it). We never prompt for it: the button is
  // fully functional without this, so nagging for a permission just to add a
  // glow would be a bad trade. Everywhere else, the glow simply never fires.
  const checkClipboard = useCallback(async () => {
    try {
      if (!navigator.permissions || !navigator.clipboard?.readText) return;
      const status = await navigator.permissions.query({
        name: "clipboard-read" as PermissionName,
      });
      if (status.state !== "granted") return;
      const text = (await navigator.clipboard.readText()).trim();
      setClipboardReady(isAddressLike(text));
    } catch {
      // Unsupported or blocked — no glow, no prompt, no error.
    }
  }, []);

  useEffect(() => {
    checkClipboard();
    // Re-check when the user tabs back, since they likely just went to copy something.
    window.addEventListener("focus", checkClipboard);
    return () => window.removeEventListener("focus", checkClipboard);
  }, [checkClipboard]);

  // Magnetic pull, pointer-only.
  useEffect(() => {
    if (reduceMotion) return;
    if (window.matchMedia("(hover: none)").matches) return;

    function onMove(e: PointerEvent) {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      if (Math.hypot(dx, dy) <= MAGNET_RADIUS) {
        mx.set((e.clientX - (r.left + r.width / 2)) * MAGNET_PULL);
        my.set((e.clientY - (r.top + r.height / 2)) * MAGNET_PULL);
      } else {
        mx.set(0);
        my.set(0);
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduceMotion]);

  async function handlePaste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;

      if (reduceMotion) {
        onPaste(text);
        return;
      }

      // Assemble: fill the field in a few rapid frames so the address visibly
      // snaps into place rather than teleporting.
      setAssembling(true);
      const steps = 7;
      const stepMs = ASSEMBLE_MS / steps;
      for (let i = 1; i <= steps; i++) {
        const cut = Math.ceil((text.length / steps) * i);
        onPaste(text.slice(0, cut));
        if (i < steps) await new Promise((r) => setTimeout(r, stepMs));
      }
      setAssembling(false);
      setClipboardReady(false);
    } catch {
      setAssembling(false);
      // Clipboard permission denied or unavailable — user can still paste manually.
    }
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handlePaste}
      className={`addr-paste${clipboardReady && !assembling ? " paste-ready" : ""}`}
      aria-label={clipboardReady ? "Paste address from clipboard (address detected)" : "Paste from clipboard"}
      style={{
        x: reduceMotion ? 0 : x,
        y: reduceMotion ? 0 : y,
        height: 30,
        padding: "0 10px",
        background: "var(--slate-2)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 6,
        color: "var(--fog-dim)",
        fontSize: 11.5,
        fontWeight: 500,
      }}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {assembling ? "…" : "Paste"}
    </motion.button>
  );
}
