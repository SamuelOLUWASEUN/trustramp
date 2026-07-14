import type { Address } from "viem";

// Set this in .env.local after you deploy the escrow contract:
// NEXT_PUBLIC_ESCROW_ADDRESS=0x...
export const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS ??
  "") as Address;

export const escrowConfigured = ESCROW_ADDRESS.length === 42;

// Mirrors the Status enum in TrustrampEscrow.sol
export enum TradeStatus {
  None = 0,
  Created = 1,
  PaymentConfirmed = 2,
  Released = 3,
  Refunded = 4,
  Disputed = 5,
  Resolved = 6,
}

export const STATUS_META: Record<
  TradeStatus,
  { label: string; tone: "held" | "cleared" | "dispute" | "neutral" }
> = {
  [TradeStatus.None]: { label: "None", tone: "neutral" },
  [TradeStatus.Created]: { label: "Held in escrow", tone: "held" },
  [TradeStatus.PaymentConfirmed]: { label: "Fiat confirmed", tone: "held" },
  [TradeStatus.Released]: { label: "Cleared", tone: "cleared" },
  [TradeStatus.Refunded]: { label: "Refunded", tone: "neutral" },
  [TradeStatus.Disputed]: { label: "Disputed", tone: "dispute" },
  [TradeStatus.Resolved]: { label: "Resolved", tone: "neutral" },
};

// Minimal ERC20 ABI for the approve + balance flow.
export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const escrowAbi = [
  {
    type: "function",
    name: "createTrade",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receiver", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "confirmWindowSeconds", type: "uint256" },
    ],
    outputs: [{ name: "tradeId", type: "uint256" }],
  },
  {
    type: "function",
    name: "confirmPayment",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "releaseFunds",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "raiseDispute",
    stateMutability: "nonpayable",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "nextTradeId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTrade",
    stateMutability: "view",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "sender", type: "address" },
          { name: "receiver", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "confirmDeadline", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getReputation",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "completedTrades", type: "uint256" },
          { name: "disputedTrades", type: "uint256" },
          { name: "refundedTrades", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export type TradeTuple = {
  sender: Address;
  receiver: Address;
  token: Address;
  amount: bigint;
  createdAt: bigint;
  confirmDeadline: bigint;
  status: number;
};

export type ReputationTuple = {
  completedTrades: bigint;
  disputedTrades: bigint;
  refundedTrades: bigint;
};
