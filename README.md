# Trustramp

Trustless escrow for P2P crypto ↔ fiat remittance trades, built for the Monad Spark hackathon.

## Structure

- `trustramp/` — the escrow smart contract (Hardhat, Solidity), tests, and deploy scripts.
- `trustramp-web/` — the Next.js frontend, wired to the contract via wagmi/viem.

## Quick start

**Contracts:**
```bash
cd trustramp
npm install
npx hardhat test
```

**Frontend:**
```bash
cd trustramp-web
npm install
cp .env.example .env.local   # paste the deployed escrow address
npm run dev
```

See each folder's own README for full detail on architecture, honest build status, and deploy steps.
