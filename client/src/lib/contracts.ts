// BAM Swap Contract Configuration
export const BAM_SWAP_ADDRESS = "0x1A7BafBBA6c0A5D9c90913D76B9953F5acEE7b4c";

// BSC Mainnet Configuration
export const BSC_CHAIN_ID = 56;
export const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

// Chainlink Price Feed Addresses on BSC Mainnet
export const CHAINLINK_FEEDS = {
  BNB_USD: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE", // BNB/USD price feed
  USDT_USD: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320", // USDT/USD price feed
} as const;

// Token Addresses on BSC Mainnet
export const TOKEN_ADDRESSES = {
  USDT: "0x55d398326f99059fF775485246999027B3197955",
  USDB: "0x4050334836d59C1276068e496aB239DC80247675",
  BAM: "0xA779f03b752fa2442e6A23f145b007f2160F9a7D",
  BNB: "0x0000000000000000000000000000000000000000", // Native BNB
} as const;

// Chainlink Aggregator V3 Interface ABI
export const CHAINLINK_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {"internalType": "uint80", "name": "roundId", "type": "uint80"},
      {"internalType": "int256", "name": "answer", "type": "int256"},
      {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// BAM Swap Contract ABI (Essential functions)
export const BAM_SWAP_ABI = [
  // Read Functions
  {
    "inputs": [],
    "name": "getContractInfo",
    "outputs": [
      {"internalType": "uint256", "name": "usdtBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "usdbBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "bamBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "bnbBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "currentBNBPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "currentBAMPrice", "type": "uint256"},
      {"internalType": "bool", "name": "priceIsValid", "type": "bool"},
      {"internalType": "bool", "name": "isUsingFallback", "type": "bool"},
      {"internalType": "bool", "name": "isEmergencyMode", "type": "bool"},
      {"internalType": "bool", "name": "isPaused", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBAMPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMinimumPurchase",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMinimumSwap",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "usdtAmount", "type": "uint256"}],
    "name": "calculateBAMFromUSDT",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "bnbAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "bnbPrice", "type": "uint256"}
    ],
    "name": "calculateBAMFromBNB",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "bamAmount", "type": "uint256"}],
    "name": "calculateUSDTFromBAM",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBNBPriceWithValidation",
    "outputs": [
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "bool", "name": "isValid", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Write Functions
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "swapUSDTToUSDB",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "swapUSDBToUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "usdtAmount", "type": "uint256"}],
    "name": "buyBAMWithUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyBAMWithBNB",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "bamAmount", "type": "uint256"}],
    "name": "sellBAMForUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "bamAmount", "type": "uint256"}],
    "name": "sellBAMForBNB",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "usdbAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "name": "SwapUSDTToUSDB",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "usdtAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "name": "SwapUSDBToUSDT",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "usdtAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "bamAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "paymentToRecipient", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "remainingInContract", "type": "uint256"}
    ],
    "name": "BuyBAMWithUSDT",
    "type": "event"
  }
] as const;

// ERC20 Token ABI (Essential functions)
export const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Token Information
export const TOKENS = {
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    address: TOKEN_ADDRESSES.USDT,
    icon: "💵"
  },
  USDB: {
    symbol: "USDB",
    name: "USD Base",
    decimals: 18,
    address: TOKEN_ADDRESSES.USDB,
    icon: "🏦"
  },
  BAM: {
    symbol: "BAM",
    name: "Build And Multiply",
    decimals: 18,
    address: TOKEN_ADDRESSES.BAM,
    icon: "🚀"
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    decimals: 18,
    address: TOKEN_ADDRESSES.BNB,
    icon: "⚡"
  }
} as const;

// Fee Information
export const FEES = {
  LOW_FEE: 0.5, // 0.5% for USDT→USDB, USDT→BAM, BNB→BAM
  HIGH_FEE: 1.5, // 1.5% for USDB→USDT, BAM→USDT, BAM→BNB
} as const;