"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MotionButton } from "@/components/MotionButton";

type Theme = "dark" | "light";

// startViewTransition isn't in TS's lib.dom yet in every version.
type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function ThemeToggle() {
  // Start as null so we render nothing until we know the real theme —
  // avoids briefly showing the wrong toggle state before hydration.
  const [theme, setTheme] = useState<Theme | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function applyTheme(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("trustramp-theme", next);
    } catch {
      // localStorage can throw in private-browsing contexts — theme just won't persist.
    }
  }

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === "light" ? "dark" : "light";
    const doc = document as ViewTransitionDocument;

    // No View Transitions support (Firefox until recently, older Safari) or the
    // user asked for reduced motion: switch instantly rather than fake it.
    if (!doc.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    // Pour from the exact centre of the button that was clicked.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    // Radius needed to reach the furthest corner of the viewport from here.
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => applyTheme(next));

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 520,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          // Clip the *incoming* snapshot, so the new theme spreads over the old
          // one like ink through water.
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }

  if (!theme) {
    // Reserve the same footprint so the header doesn't jump once this hydrates.
    return <div style={{ width: 38, height: 38 }} aria-hidden="true" />;
  }

  return (
    <MotionButton
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: "none",
        background: "transparent",
        color: "var(--fog-dim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 19,
      }}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </MotionButton>
  );
}
