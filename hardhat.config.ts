import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      type: "http",
      url: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
      chainId: 1,
    },
    sepolia: {
      type: "http",
      url:
        process.env.SEPOLIA_RPC_URL ||
        "https://eth-sepolia.g.alchemy.com/v2/demo",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
    polygon: {
      type: "http",
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.VERIFIABLE_INTAKE_PRIVATE_KEY
        ? [process.env.VERIFIABLE_INTAKE_PRIVATE_KEY]
        : [],
      chainId: 137,
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
