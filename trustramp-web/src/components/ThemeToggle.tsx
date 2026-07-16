"use client";

import { MotionButton } from "@/components/MotionButton";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  // Start as null so we render nothing until we know the real theme —
  // avoids briefly showing the wrong toggle state before hydration.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("trustramp-theme", next);
    } catch {
      // localStorage can throw in private-browsing contexts — theme just won't persist.
    }
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
