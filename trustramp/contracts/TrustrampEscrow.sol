// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title TrustrampEscrow
/// @notice Trustless escrow for P2P crypto <-> fiat remittance trades (e.g. USDC <-> NGN).
///         Sender locks stablecoin onchain, receiver confirms the offchain fiat leg was sent,
///         sender releases funds once fiat is confirmed received. Every trade updates an
///         onchain reputation record so future counterparties can check trade history before
///         they agree to trade at all.
/// @dev Deliberately scoped: no KYC, no bank rails, no oracle. This contract only solves the
///      "will I get paid / will they release my funds" trust problem, not the FX conversion itself.
contract TrustrampEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum Status {
        None,
        Created, // sender has locked funds, waiting for receiver to confirm fiat sent
        PaymentConfirmed, // receiver says fiat leg is done, waiting for sender to release
        Released, // sender confirmed receipt, funds paid out to receiver
        Refunded, // receiver never confirmed in time, sender reclaimed funds
        Disputed, // either party flagged a problem, frozen until arbiter resolves
        Resolved // arbiter resolved a dispute
    }

    struct Trade {
        address sender; // locks stablecoin, wants NGN (or other fiat) delivered
        address receiver; // will send fiat offchain, receives stablecoin onchain
        address token; // ERC20 stablecoin used for the crypto leg
        uint256 amount;
        uint256 createdAt;
        uint256 confirmDeadline; // receiver must call confirmPayment() before this, else sender can refund
        Status status;
    }

    struct Reputation {
        uint256 completedTrades;
        uint256 disputedTrades;
        uint256 refundedTrades; // counterparty flaked or was too slow
    }

    uint256 public nextTradeId = 1;
    mapping(uint256 => Trade) public trades;
    mapping(address => Reputation) public reputationOf;

    uint256 public constant MIN_CONFIRM_WINDOW = 1 hours;
    uint256 public constant MAX_CONFIRM_WINDOW = 7 days;

    event TradeCreated(
        uint256 indexed tradeId,
        address indexed sender,
        address indexed receiver,
        address token,
        uint256 amount,
        uint256 confirmDeadline
    );
    event PaymentConfirmed(uint256 indexed tradeId, address indexed receiver);
    event FundsReleased(uint256 indexed tradeId, address indexed receiver, uint256 amount);
    event TradeRefunded(uint256 indexed tradeId, address indexed sender, uint256 amount);
    event TradeDisputed(uint256 indexed tradeId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed tradeId, bool releasedToReceiver, address resolvedBy);

    error NotSender();
    error NotReceiver();
    error NotParty();
    error InvalidStatus();
    error DeadlineNotPassed();
    error DeadlinePassed();
    error InvalidWindow();
    error ZeroAmount();
    error ZeroAddress();

    constructor() Ownable(msg.sender) {}

    /// @notice Sender locks `amount` of `token` into escrow for `receiver`.
    /// @param receiver Counterparty who will send the offchain fiat leg.
    /// @param token ERC20 stablecoin address (e.g. USDC on Monad).
    /// @param amount Amount of `token` to lock.
    /// @param confirmWindowSeconds How long the receiver has to call confirmPayment() before
    ///        the sender is allowed to reclaim funds via refund().
    function createTrade(
        address receiver,
        address token,
        uint256 amount,
        uint256 confirmWindowSeconds
    ) external nonReentrant returns (uint256 tradeId) {
        if (receiver == address(0) || token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (confirmWindowSeconds < MIN_CONFIRM_WINDOW || confirmWindowSeconds > MAX_CONFIRM_WINDOW) {
            revert InvalidWindow();
        }

        tradeId = nextTradeId++;
        uint256 deadline = block.timestamp + confirmWindowSeconds;

        trades[tradeId] = Trade({
            sender: msg.sender,
            receiver: receiver,
            token: token,
            amount: amount,
            createdAt: block.timestamp,
            confirmDeadline: deadline,
            status: Status.Created
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit TradeCreated(tradeId, msg.sender, receiver, token, amount, deadline);
    }

    /// @notice Receiver calls this once they've sent the offchain fiat leg (e.g. NGN transfer).
    function confirmPayment(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        if (msg.sender != t.receiver) revert NotReceiver();
        if (t.status != Status.Created) revert InvalidStatus();
        if (block.timestamp > t.confirmDeadline) revert DeadlinePassed();

        t.status = Status.PaymentConfirmed;
        emit PaymentConfirmed(tradeId, msg.sender);
    }

    /// @notice Sender calls this once they've verified the fiat arrived, releasing stablecoin to receiver.
    function releaseFunds(uint256 tradeId) external nonReentrant {
        Trade storage t = trades[tradeId];
        if (msg.sender != t.sender) revert NotSender();
        if (t.status != Status.PaymentConfirmed) revert InvalidStatus();

        t.status = Status.Released;
        reputationOf[t.sender].completedTrades++;
        reputationOf[t.receiver].completedTrades++;

        IERC20(t.token).safeTransfer(t.receiver, t.amount);
        emit FundsReleased(tradeId, t.receiver, t.amount);
    }

    /// @notice Sender reclaims funds if the receiver never confirmed payment before the deadline.
    function refund(uint256 tradeId) external nonReentrant {
        Trade storage t = trades[tradeId];
        if (msg.sender != t.sender) revert NotSender();
        if (t.status != Status.Created) revert InvalidStatus();
        if (block.timestamp <= t.confirmDeadline) revert DeadlineNotPassed();

        t.status = Status.Refunded;
        reputationOf[t.receiver].refundedTrades++;

        IERC20(t.token).safeTransfer(t.sender, t.amount);
        emit TradeRefunded(tradeId, t.sender, t.amount);
    }

    /// @notice Either party can flag a problem (e.g. fiat sent but sender won't release, or
    ///         fiat never arrived despite confirmPayment). Freezes the trade for arbiter review.
    function raiseDispute(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        if (msg.sender != t.sender && msg.sender != t.receiver) revert NotParty();
        if (t.status != Status.Created && t.status != Status.PaymentConfirmed) revert InvalidStatus();

        t.status = Status.Disputed;
        reputationOf[t.sender].disputedTrades++;
        reputationOf[t.receiver].disputedTrades++;

        emit TradeDisputed(tradeId, msg.sender);
    }

    /// @notice Arbiter (contract owner) resolves a dispute by sending funds to one side.
    ///         MVP uses a single trusted arbiter; a production version should replace this
    ///         with a multisig or a proper dispute-resolution module.
    function resolveDispute(uint256 tradeId, bool releaseToReceiver) external onlyOwner nonReentrant {
        Trade storage t = trades[tradeId];
        if (t.status != Status.Disputed) revert InvalidStatus();

        t.status = Status.Resolved;
        address recipient = releaseToReceiver ? t.receiver : t.sender;

        IERC20(t.token).safeTransfer(recipient, t.amount);
        emit DisputeResolved(tradeId, releaseToReceiver, msg.sender);
    }

    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    function getReputation(address account) external view returns (Reputation memory) {
        return reputationOf[account];
    }
}
