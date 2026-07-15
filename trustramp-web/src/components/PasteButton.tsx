"use client";

export function PasteButton({ onPaste }: { onPaste: (text: string) => void }) {
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onPaste(text.trim());
    } catch {
      // Clipboard permission denied or unavailable — user can still paste manually via keyboard.
    }
  }

  return (
    <button
      type="button"
      onClick={handlePaste}
      style={{
        height: 40,
        padding: "0 12px",
        background: "transparent",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 8,
        color: "var(--fog-dim)",
        fontSize: 12.5,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      Paste
    </button>
  );
}
