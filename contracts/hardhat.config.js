require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: process.env.COMPILER_VERSION || "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: parseInt(process.env.OPTIMIZER_RUNS || "200")
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.BSC_MAINNET_URL || "https://bsc-dataseed1.binance.org/",
        enabled: false
      }
    },
    bsc: {
      url: process.env.BSC_MAINNET_URL || "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      gasPrice: parseInt(process.env.GAS_PRICE || "5000000000"), // 5 gwei default
      gas: parseInt(process.env.GAS_LIMIT || "5000000"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      gasPrice: parseInt(process.env.GAS_PRICE || "10000000000"), // 10 gwei for testnet
      gas: parseInt(process.env.GAS_LIMIT || "5000000"),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};