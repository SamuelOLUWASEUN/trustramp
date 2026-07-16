"use client";

import { MotionButton } from "@/components/MotionButton";
import { useState } from "react";
import { type Address } from "viem";
import { useReadContract } from "wagmi";
import { ESCROW_ADDRESS, escrowAbi, type ReputationTuple } from "@/lib/contract";
import { isAddressLike } from "@/lib/format";
import { PasteButton } from "@/components/PasteButton";

export function ReputationLookup() {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<Address | null>(null);

  const { data, isFetching } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: escrowAbi,
    functionName: "getReputation",
    args: target ? [target] : undefined,
    query: { enabled: !!target },
  });

  const rep = data as ReputationTuple | undefined;
  const completed = rep ? Number(rep.completedTrades) : 0;
  const disputed = rep ? Number(rep.disputedTrades) : 0;
  const refunded = rep ? Number(rep.refundedTrades) : 0;
  const total = completed + disputed + refunded;

  return (
    <section style={card.root}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        Reputation check
      </div>
      <p style={{ fontSize: 12.5, color: "var(--fog-faint)", marginBottom: 14, lineHeight: 1.5 }}>
        Before you trade with someone, look up their onchain history.
      </p>

      <div className="reputation-actions" style={{ marginBottom: 18 }}>
        <div className="addr-field">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
            placeholder="0x… wallet address"
            style={card.input}
            className="mono"
          />
          <PasteButton onPaste={setInput} />
        </div>
        <MotionButton
          onClick={() => isAddressLike(input) && setTarget(input)}
          disabled={!isAddressLike(input)}
          className="check-btn"
          style={{ ...card.btn, opacity: isAddressLike(input) ? 1 : 0.45 }}
        >
          Check
        </MotionButton>
      </div>

      {target && (
        <div style={card.result}>
          {isFetching ? (
            <div style={card.stats}>
              <div className="skeleton" style={{ width: "100%", height: 44 }} />
              <div className="skeleton" style={{ width: "100%", height: 44 }} />
              <div className="skeleton" style={{ width: "100%", height: 44 }} />
            </div>
          ) : total === 0 ? (
            <span style={{ color: "var(--held)", fontSize: 13, lineHeight: 1.5 }}>
              No trade history. Could be new, could be a fresh wallet — treat with caution and
              start small.
            </span>
          ) : (
            <div style={card.stats}>
              <Stat n={completed} label="Cleared" color="var(--cleared)" />
              <Stat n={refunded} label="Refunded" color="var(--fog-dim)" />
              <Stat n={disputed} label="Disputed" color="var(--dispute)" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 24, color }}>
        {n}
      </div>
      <div style={{ fontSize: 11, color: "var(--fog-dim)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const card = {
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
  btn: {
    height: 40,
    padding: "0 18px",
    background: "transparent",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  } as React.CSSProperties,
  result: {
    paddingTop: 16,
    borderTop: "1px solid var(--hairline)",
  } as React.CSSProperties,
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  } as React.CSSProperties,
};
