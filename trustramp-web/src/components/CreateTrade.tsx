"use client";

import { useState } from "react";
import { parseUnits, type Address } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi, erc20Abi } from "@/lib/contract";
import { isAddressLike } from "@/lib/format";

const WINDOW_OPTIONS = [
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 21600 },
  { label: "24 hours", seconds: 86400 },
  { label: "3 days", seconds: 259200 },
];

export function CreateTrade({ onCreated }: { onCreated?: () => void }) {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [receiver, setReceiver] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [windowSec, setWindowSec] = useState(86400);
  const [step, setStep] = useState<"idle" | "approving" | "creating">("idle");
  const [error, setError] = useState<string | null>(null);

  const validReceiver = isAddressLike(receiver);
  const validToken = isAddressLike(token);
  const amountNum = parseFloat(amount);
  const validAmount = !Number.isNaN(amountNum) && amountNum > 0;
  const canSubmit = isConnected && validReceiver && validToken && validAmount && step === "idle";

  async function submit() {
    setError(null);
    try {
      const parsed = parseUnits(amount, 6); // USDC-style 6 decimals

      setStep("approving");
      await writeContractAsync({
        address: token as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ESCROW_ADDRESS, parsed],
      });

      setStep("creating");
      await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "createTrade",
        args: [receiver as Address, token as Address, parsed, BigInt(windowSec)],
      });

      setReceiver("");
      setToken("");
      setAmount("");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStep("idle");
    }
  }

  return (
    <section style={form.root}>
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        New trade · lock funds
      </div>

      <Field label="Receiver wallet" hint={receiver && !validReceiver ? "Not a valid address" : undefined}>
        <input
          value={receiver}
          onChange={(e) => setReceiver(e.target.value.trim())}
          placeholder="0x… the person sending you naira"
          style={form.input}
          className="mono"
        />
      </Field>

      <Field label="Stablecoin address" hint={token && !validToken ? "Not a valid address" : "USDC / USDT0 on Monad"}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          placeholder="0x… token contract"
          style={form.input}
          className="mono"
        />
      </Field>

      <div style={form.row}>
        <Field label="Amount to lock">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="100"
              style={form.input}
              className="mono"
            />
            <span style={{ color: "var(--fog-dim)", fontSize: 13 }}>USDC</span>
          </div>
        </Field>

        <Field label="Confirm window">
          <select
            value={windowSec}
            onChange={(e) => setWindowSec(Number(e.target.value))}
            style={form.input}
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.seconds} value={o.seconds}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p style={form.explainer}>
        Your funds sit in the escrow contract until you release them. If the receiver doesn&apos;t
        confirm the naira transfer before the window closes, you can reclaim everything.
      </p>

      {error && <div style={form.error}>{error}</div>}

      <button onClick={submit} disabled={!canSubmit} style={{ ...form.submit, opacity: canSubmit ? 1 : 0.45 }}>
        {step === "approving"
          ? "Approving token…"
          : step === "creating"
            ? "Locking funds…"
            : "Lock funds in escrow"}
      </button>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <label style={{ fontSize: 12, color: "var(--fog-dim)" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "var(--fog-faint)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const form = {
  root: {
    background: "var(--slate)",
    border: "1px solid var(--hairline)",
    borderRadius: 14,
    padding: "20px 22px",
  } as React.CSSProperties,
  input: {
    width: "100%",
    height: 40,
    background: "var(--void)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 8,
    color: "var(--fog)",
    padding: "0 12px",
    fontSize: 14,
  } as React.CSSProperties,
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  } as React.CSSProperties,
  explainer: {
    fontSize: 12.5,
    lineHeight: 1.55,
    color: "var(--fog-faint)",
    marginTop: 4,
    marginBottom: 18,
  } as React.CSSProperties,
  error: {
    fontSize: 12.5,
    color: "var(--dispute)",
    marginBottom: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  } as React.CSSProperties,
  submit: {
    width: "100%",
    height: 44,
    background: "var(--accent)",
    color: "var(--void)",
    border: "none",
    borderRadius: 10,
    fontSize: 14.5,
    fontWeight: 500,
  } as React.CSSProperties,
};
