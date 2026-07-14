# Trustramp

Trustless escrow for P2P crypto ↔ fiat remittance trades, built for the Monad **Spark** hackathon.

## The problem

Sending money between the UK and Nigeria via P2P crypto trades means trusting a stranger:
you send stablecoin (or send naira) first, and hope the other side follows through. There's
no visibility into whether you're getting a fair rate, and no protection if the counterparty
doesn't hold up their end.

## What Trustramp does

1. **Sender locks stablecoin** into an onchain escrow contract for a specific receiver.
2. **Receiver sends the offchain fiat leg** (e.g. NGN bank transfer) and calls `confirmPayment()`.
3. **Sender releases the stablecoin** once they've verified the fiat arrived.
4. If the receiver never confirms in time, the **sender can reclaim their funds** automatically.
5. Either side can **raise a dispute**, which freezes the trade for arbiter review.
6. Every completed, refunded, or disputed trade updates each address's **onchain reputation** —
   so before you trade with someone, you can check their history.

This does *not* try to solve KYC, bank rails, or FX conversion — it solves the specific trust
problem of "will I actually get paid," which is the part that's genuinely dangerous in P2P trades.

## Architecture

- `contracts/TrustrampEscrow.sol` — the core escrow contract. Built on OpenZeppelin's
  `ReentrancyGuard` and `Ownable` rather than hand-rolled versions.
- `contracts/mocks/MockUSDC.sol` — mintable test token, **local testing only**. Real deployments
  point at the actual USDC/USDT0 address on Monad.
- `test/TrustrampEscrow.test.js` — 13 tests covering the happy path, refund-on-timeout, dispute
  resolution both directions, and access control on every state-changing function.
- Frontend (Next.js) — **not built yet**, see status below.

## Status (honest, as of scaffolding)

**Built and tested:**
- Full escrow contract: create → confirm → release, refund-on-timeout, dispute + arbiter resolution, reputation tracking
- 13/13 tests passing locally (`npx hardhat test`)

**Not built yet:**
- Frontend UI (trade creation, rate comparison widget, reputation display)
- Deployment to Monad testnet/mainnet (needs your own funded wallet + RPC)
- Live FX rate feed integration for the rate-comparison widget
- Dispute resolution is a single trusted owner address for MVP speed — a real production
  version should replace this with a multisig, flagged clearly if this ships as-is

## Local setup

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploying to Monad testnet

1. Copy `.env.example` to `.env` and fill in a funded testnet private key.
2. Get testnet MON from the Monad faucet.
3. Run:
   ```bash
   npx hardhat run scripts/deploy.js --network monadTestnet
   ```
4. Verify the contract (required by the hackathon judging agent):
   ```bash
   npx hardhat verify --network monadTestnet <DEPLOYED_ADDRESS>
   ```

## A note on the hardhat.config.js compiler override

This project was scaffolded in a sandboxed environment without access to
`binaries.soliditylang.org`, so `hardhat.config.js` includes a subtask override that points
Hardhat at the locally installed `solc` npm package instead of downloading the compiler.
It's harmless to leave in, but on your own machine with normal internet access you can delete
that block and Hardhat will just download the compiler itself as usual.
