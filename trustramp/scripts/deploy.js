const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying TrustrampEscrow with account:", deployer.address);
  console.log("Network:", hre.network.name);

  const TrustrampEscrow = await hre.ethers.getContractFactory("TrustrampEscrow");
  const escrow = await TrustrampEscrow.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("TrustrampEscrow deployed to:", address);
  console.log("\nNext steps:");
  console.log(`  1. Verify: npx hardhat verify --network ${hre.network.name} ${address}`);
  console.log("  2. Save this address into your frontend .env as NEXT_PUBLIC_ESCROW_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
