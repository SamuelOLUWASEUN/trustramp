"use client";

import { MotionButton } from "@/components/MotionButton";
import { useState } from "react";
import { parseUnits, type Address } from "viem";
import { useAccount, useWriteContract, useChainId, useSwitchChain } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi, erc20Abi } from "@/lib/contract";
import { isAddressLike, sanitizeDecimalInput } from "@/lib/format";
import { monadTestnet } from "@/lib/chains";
import { PasteButton } from "@/components/PasteButton";
import { Spinner } from "@/components/Spinner";
import { useWalletConnect } from "@/lib/useWalletConnect";
import { SpeedBeam, type BeamPhase } from "@/components/SpeedBeam";

const WINDOW_OPTIONS = [
  { label: "1 hour", seconds: 3600 },
  { label: "6 hours", seconds: 21600 },
  { label: "24 hours", seconds: 86400 },
  { label: "3 days", seconds: 259200 },
];

export function CreateTrade({ onCreated }: { onCreated?: () => void }) {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const onWrongNetwork = isConnected && chainId !== monadTestnet.id;
  const { isPending: connectPending, connectOrOpenMetaMask } = useWalletConnect();

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
  const canSubmit =
    isConnected && !onWrongNetwork && validReceiver && validToken && validAmount && step === "idle";

  async function submit() {
    setError(null);
    try {
      const parsed = parseUnits(amount, 6); // USDC-style 6 decimals

      setStep("approving");
      // chainId is passed explicitly on every write so the wallet is asked to sign on
      // Monad testnet specifically — without this, a wallet sitting on a different
      // chain (e.g. Ethereum mainnet by default) will try to sign there instead,
      // which is what caused a real-ETH gas prompt during testing.
      await writeContractAsync({
        address: token as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ESCROW_ADDRESS, parsed],
        chainId: monadTestnet.id,
      });

      setStep("creating");
      await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "createTrade",
        args: [receiver as Address, token as Address, parsed, BigInt(windowSec)],
        chainId: monadTestnet.id,
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

  // approving = waiting on the wallet; creating = broadcast, waiting on Monad.
  const beamPhase: BeamPhase =
    step === "approving" ? "signing" : step === "creating" ? "broadcasting" : "idle";

  return (
    <section style={{ ...form.root, position: "relative" }}>
      <SpeedBeam phase={beamPhase} />
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        New trade · lock funds
      </div>

      <Field
        label="Receiver wallet"
        hint={receiver && !validReceiver ? "Not a valid address" : undefined}
        isError={!!receiver && !validReceiver}
      >
        <div className="addr-field">
          <input
            value={receiver}
            onChange={(e) => setReceiver(e.target.value.trim())}
            placeholder="0x… the person sending you naira"
            style={{
              ...form.input,
              ...(receiver && !validReceiver ? form.inputError : {}),
            }}
            className="mono"
          />
          <PasteButton onPaste={setReceiver} />
        </div>
      </Field>

      <Field
        label="Stablecoin address"
        hint={token && !validToken ? "Not a valid address" : "USDC / USDT0 on Monad"}
        isError={!!token && !validToken}
      >
        <div className="addr-field">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value.trim())}
            placeholder="0x… token contract"
            style={{
              ...form.input,
              ...(token && !validToken ? form.inputError : {}),
            }}
            className="mono"
          />
          <PasteButton onPaste={setToken} />
        </div>
      </Field>

      <div style={form.row}>
        <Field label="Amount to lock">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(sanitizeDecimalInput(e.target.value))}
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

      {!isConnected ? (
        <MotionButton onClick={connectOrOpenMetaMask} disabled={connectPending} style={form.connectBlocker}>
          {connectPending ? (
            <>
              <Spinner /> Opening wallet…
            </>
          ) : (
            "🔌 Connect wallet to lock funds"
          )}
        </MotionButton>
      ) : onWrongNetwork ? (
        <MotionButton
          onClick={() => switchChainAsync({ chainId: monadTestnet.id }).catch(() => {})}
          style={form.switchNetwork}
        >
          Switch to Monad testnet to continue
        </MotionButton>
      ) : (
        <MotionButton onClick={submit} disabled={!canSubmit} style={{ ...form.submit, opacity: canSubmit ? 1 : 0.45 }}>
          {step === "approving" ? (
            <>
              <Spinner /> Approving token…
            </>
          ) : step === "creating" ? (
            <>
              <Spinner /> Locking funds…
            </>
          ) : (
            "Lock funds in escrow"
          )}
        </MotionButton>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  isError,
  children,
}: {
  label: string;
  hint?: string;
  isError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <label style={{ fontSize: 12, color: "var(--fog-dim)" }}>{label}</label>
        {hint && (
          <span
            style={{
              fontSize: isError ? 12 : 11,
              fontWeight: isError ? 600 : 400,
              color: isError ? "var(--dispute)" : "var(--fog-faint)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isError && <span aria-hidden="true">⚠</span>}
            {hint}
          </span>
        )}
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
    background: "var(--input-bg)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 8,
    color: "var(--fog)",
    padding: "0 12px",
    fontSize: 14,
    minWidth: 0,
  } as React.CSSProperties,
  inputError: {
    borderColor: "var(--dispute)",
    boxShadow: "0 0 0 1px var(--dispute)",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  } as React.CSSProperties,
  switchNetwork: {
    width: "100%",
    height: 44,
    background: "transparent",
    color: "var(--held)",
    border: "1px solid var(--held)",
    borderRadius: 10,
    fontSize: 14.5,
    fontWeight: 500,
  } as React.CSSProperties,
  connectBlocker: {
    width: "100%",
    height: 44,
    background: "var(--slate-2)",
    color: "var(--fog-dim)",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 10,
    fontSize: 14.5,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  } as React.CSSProperties,
};
