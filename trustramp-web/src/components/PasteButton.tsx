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
      className="addr-paste"
      style={{
        height: 30,
        padding: "0 10px",
        background: "var(--slate-2)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: 6,
        color: "var(--fog-dim)",
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      Paste
    </button>
  );
}
