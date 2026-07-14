const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TrustrampEscrow", function () {
  let escrow, usdc;
  let owner, sender, receiver, stranger;
  const AMOUNT = ethers.parseUnits("100", 6); // 100 mUSDC
  const CONFIRM_WINDOW = 3600; // 1 hour

  beforeEach(async function () {
    [owner, sender, receiver, stranger] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const TrustrampEscrow = await ethers.getContractFactory("TrustrampEscrow");
    escrow = await TrustrampEscrow.deploy();

    await usdc.mint(sender.address, ethers.parseUnits("1000", 6));
    await usdc.connect(sender).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  describe("createTrade", function () {
    it("locks funds and stores trade details", async function () {
      await expect(
        escrow.connect(sender).createTrade(receiver.address, await usdc.getAddress(), AMOUNT, CONFIRM_WINDOW)
      ).to.emit(escrow, "TradeCreated");

      const trade = await escrow.getTrade(1);
      expect(trade.sender).to.equal(sender.address);
      expect(trade.receiver).to.equal(receiver.address);
      expect(trade.amount).to.equal(AMOUNT);
      expect(trade.status).to.equal(1); // Created

      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
    });

    it("reverts on zero amount", async function () {
      await expect(
        escrow.connect(sender).createTrade(receiver.address, await usdc.getAddress(), 0, CONFIRM_WINDOW)
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
    });

    it("reverts on confirm window outside allowed bounds", async function () {
      await expect(
        escrow.connect(sender).createTrade(receiver.address, await usdc.getAddress(), AMOUNT, 60)
      ).to.be.revertedWithCustomError(escrow, "InvalidWindow");
    });
  });

  describe("happy path: confirm -> release", function () {
    beforeEach(async function () {
      await escrow.connect(sender).createTrade(receiver.address, await usdc.getAddress(), AMOUNT, CONFIRM_WINDOW);
    });

    it("only the receiver can confirm payment", async function () {
      await expect(escrow.connect(stranger).confirmPayment(1)).to.be.revertedWithCustomError(
        escrow,
        "NotReceiver"
      );
      await expect(escrow.connect(receiver).confirmPayment(1)).to.emit(escrow, "PaymentConfirmed");
    });

    it("only the sender can release funds, and only after confirmation", async function () {
      await expect(escrow.connect(sender).releaseFunds(1)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
      );

      await escrow.connect(receiver).confirmPayment(1);

      await expect(escrow.connect(stranger).releaseFunds(1)).to.be.revertedWithCustomError(
        escrow,
        "NotSender"
      );

      const balBefore = await usdc.balanceOf(receiver.address);
      await expect(escrow.connect(sender).releaseFunds(1)).to.emit(escrow, "FundsReleased");
      const balAfter = await usdc.balanceOf(receiver.address);

      expect(balAfter - balBefore).to.equal(AMOUNT);
    });

    it("updates reputation for both parties on completion", async function () {
      await escrow.connect(receiver).confirmPayment(1);
      await escrow.connect(sender).releaseFunds(1);

      const senderRep = await escrow.getReputation(sender.address);
      const receiverRep = await escrow.getReputation(receiver.address);
      expect(senderRep.completedTrades).to.equal(1);
      expect(receiverRep.completedTrades).to.equal(1);
    });
  });

  describe("refund path", function () {
    beforeEach(async function () {
      await escrow.connect(sender).createTrade(receiver.address, await usdc.getAddress(), AMOUNT, CONFIRM_WINDOW);
    });

    it("blocks refund before deadline passes", async function () {
      await expect(escrow.connect(sender).refund(1)).to.be.revertedWithCustomError(
        escrow,
        "DeadlineNotPassed"
      );
    });

    it("allows sender to reclaim funds once deadline passes with no confirmation", async function () {
      await time.increase(CONFIRM_WINDOW + 1);

      const balBefore = await usdc.balanceOf(sender.address);
      await expect(escrow.connect(sender).refund(1)).to.emit(escrow, "TradeRefunded");
      const balAfter = await usdc.balanceOf(sender.address);

      expect(balAfter - balBefore).to.equal(AMOUNT);

      const receiverRep = await escrow.getReputation(receiver.address);
      expect(receiverRep.refundedTrades).to.equal(1);
    });

    it("blocks receiver from confirming after the deadline", async function () {
      await time.increase(CONFIRM_WINDOW + 1);
      await expect(escrow.connect(receiver).confirmPayment(1)).to.be.revertedWithCustomError(
        escrow,
        "DeadlinePassed"
      );
    });
  });

  describe("dispute path", function () {
    beforeEach(async function () {
      await escrow.connect(sender).createTrade(receiver.address, await usdc.getAddress(), AMOUNT, CONFIRM_WINDOW);
    });

    it("only sender or receiver can raise a dispute", async function () {
      await expect(escrow.connect(stranger).raiseDispute(1)).to.be.revertedWithCustomError(
        escrow,
        "NotParty"
      );
      await expect(escrow.connect(receiver).raiseDispute(1)).to.emit(escrow, "TradeDisputed");
    });

    it("only the owner (arbiter) can resolve a dispute", async function () {
      await escrow.connect(receiver).raiseDispute(1);
      await expect(
        escrow.connect(stranger).resolveDispute(1, true)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("arbiter can resolve in favor of receiver", async function () {
      await escrow.connect(sender).raiseDispute(1);

      const balBefore = await usdc.balanceOf(receiver.address);
      await expect(escrow.connect(owner).resolveDispute(1, true)).to.emit(escrow, "DisputeResolved");
      const balAfter = await usdc.balanceOf(receiver.address);

      expect(balAfter - balBefore).to.equal(AMOUNT);
    });

    it("arbiter can resolve in favor of sender", async function () {
      await escrow.connect(sender).raiseDispute(1);

      const balBefore = await usdc.balanceOf(sender.address);
      await escrow.connect(owner).resolveDispute(1, false);
      const balAfter = await usdc.balanceOf(sender.address);

      expect(balAfter - balBefore).to.equal(AMOUNT);
    });
  });
});
