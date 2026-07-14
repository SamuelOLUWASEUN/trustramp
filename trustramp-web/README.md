# Trustramp — web

Frontend for Trustramp, the P2P remittance escrow on Monad. Next.js 15 (App Router) +
wagmi + viem.

## What's here

- Custom wallet connect (injected/MetaMask) with a Monad-testnet network guard — no RainbowKit,
  so the UI keeps its own identity.
- `RateCheck` — live USD→NGN mid-market rate vs. the rate a counterparty offered you, with a
  plain-language verdict. Degrades gracefully if the FX API is down.
- `CreateTrade` — approve + `createTrade` flow to lock stablecoin into escrow.
- `TradeList` + `TradeTicket` — your trades rendered as boarding-pass-style tickets, with
  role- and status-gated actions (confirm / release / refund / dispute).
- `ReputationLookup` — check any wallet's onchain trade history before you deal with them.

## Design

Transit-document identity: every trade is a stamped ticket that moves through checkpoints. The
contract's own states (`Created → PaymentConfirmed → Released`, plus `Refunded`/`Disputed`) drive
the color system — amber = held, green = cleared, red = disputed. Space Grotesk for display,
JetBrains Mono for all onchain data (addresses, amounts, trade serials).

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your deployed escrow address
npm run dev
```

Set `NEXT_PUBLIC_ESCROW_ADDRESS` to the contract you deployed from the `trustramp` (contracts)
repo. Until it's set, the app shows a "contract not set" notice and disables trades.

## Status (honest)

**Built:** full UI for the whole trade lifecycle, wired to the real contract ABI, typechecks and
builds clean (`npm run build`).

**Not done yet / needs you:**
- The contract has to be deployed and its address dropped into `.env.local` before anything works
  end to end.
- Token decimals are assumed to be 6 (USDC-style). If you use an 18-decimal token, adjust the
  `parseUnits`/`formatUnits` calls in `CreateTrade.tsx` and `TradeTicket.tsx`.
- `TradeList` reads every trade and filters client-side. Fine for a hackathon; for scale you'd
  index events instead.
- No toast system — errors surface via inline text and one `alert()` in `TradeTicket`. Worth
  replacing with a proper toast before you show it around.
