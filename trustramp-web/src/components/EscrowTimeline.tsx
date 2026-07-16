"use client";

import { TradeStatus } from "@/lib/contract";

const NODES = ["Funds locked", "Bank transfer confirmed", "Escrow released"];

// Maps the contract's actual state machine onto the three visible nodes.
// Refunded/Disputed are real outcomes that don't reach node 3, so they're
// reported honestly rather than being forced onto the happy path.
function stepFor(status: TradeStatus): { reached: number; live: number | null; note?: string } {
  switch (status) {
    case TradeStatus.Created:
      return { reached: 1, live: 1 }; // waiting on the receiver's fiat leg
    case TradeStatus.PaymentConfirmed:
      return { reached: 2, live: 2 }; // waiting on the sender to release
    case TradeStatus.Released:
    case TradeStatus.Resolved:
      return { reached: 3, live: null };
    case TradeStatus.Refunded:
      return { reached: 1, live: null, note: "Refunded to sender — window closed unconfirmed" };
    case TradeStatus.Disputed:
      return { reached: 2, live: null, note: "Disputed — frozen pending arbiter" };
    default:
      return { reached: 0, live: null };
  }
}

export function EscrowTimeline({ status }: { status: TradeStatus }) {
  const { reached, live, note } = stepFor(status);
  const isDispute = status === TradeStatus.Disputed;

  return (
    <div style={{ marginTop: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Escrow route
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {NODES.map((node, i) => {
          const index = i + 1;
          const done = index <= reached;
          const legLive = live === index;
          return (
            <div
              key={node}
              style={{ display: "flex", alignItems: "center", flex: i === NODES.length - 1 ? "0 0 auto" : 1 }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: 0 }}>
                <span
                  className={legLive ? "badge-breathing" : undefined}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: done
                      ? isDispute && index === 2
                        ? "var(--dispute)"
                        : "var(--cleared)"
                      : "transparent",
                    border: `1.5px solid ${
                      done
                        ? isDispute && index === 2
                          ? "var(--dispute)"
                          : "var(--cleared)"
                        : "var(--hairline-strong)"
                    }`,
                    color: "var(--cleared)",
                  }}
                />
                <span
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.04em",
                    textAlign: "center",
                    color: done ? "var(--fog-dim)" : "var(--fog-faint)",
                    maxWidth: 78,
                    lineHeight: 1.3,
                  }}
                >
                  {node}
                </span>
              </div>

              {i < NODES.length - 1 && (
                <div
                  className={legLive ? "leg-live" : undefined}
                  style={{
                    flex: 1,
                    height: 2,
                    margin: "0 6px",
                    marginBottom: 22,
                    borderRadius: 2,
                    background:
                      index < reached ? "var(--cleared)" : "var(--hairline-strong)",
                    opacity: index < reached ? 0.7 : 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {note && (
        <p style={{ fontSize: 11.5, color: "var(--fog-faint)", marginTop: 10, lineHeight: 1.5 }}>
          {note}
        </p>
      )}
    </div>
  );
}
