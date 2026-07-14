require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");

// NOTE: this override exists only because the sandbox this was scaffolded in has no access
// to binaries.soliditylang.org. It forces Hardhat to use the locally installed `solc` npm
// package instead of downloading the compiler. Safe to delete once you're compiling locally
// with normal internet access — Hardhat will just download the compiler as usual.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD).setAction(async (args, hre, runSuper) => {
  if (args.solcVersion === "0.8.28") {
    return {
      compilerPath: require.resolve("solc/soljson.js"),
      isSolcJs: true,
      version: args.solcVersion,
      longVersion: args.solcVersion,
    };
  }
  return runSuper(args);
});


const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "1".repeat(64); // placeholder, never commit a real key

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: [PRIVATE_KEY],
    },
    monadMainnet: {
      url: process.env.MONAD_MAINNET_RPC || "https://rpc.monad.xyz",
      chainId: 143,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    // Monad uses Sourcify/Blockscout-style verification, see docs.monad.xyz/guides/verify-smart-contract
    apiKey: {
      monadTestnet: "not-needed-for-blockscout",
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com",
        },
      },
    ],
  },
};
