// BAM Swap Contract Configuration - V3 FIXED CONTRACT  
export const BAM_SWAP_ADDRESS = "0x6fCbbc0834E9c0E3AFc4A96F47a19E29b6261934";

// BSC Mainnet Configuration
export const BSC_CHAIN_ID = 56;
export const BSC_RPC_URL = import.meta.env.VITE_CHAINSTACK_BSC_ENDPOINT || "https://rpc.ankr.com/bsc"; // Chainstack priority, then Ankr fallback

// Chainlink Price Feed Addresses on BSC Mainnet
export const CHAINLINK_FEEDS = {
  BNB_USD: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE", // BNB/USD price feed
  USDT_USD: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320", // USDT/USD price feed
} as const;

// Token Addresses on BSC Mainnet
// All tokens use 18 decimals: USDT, USDB, BAM, BNB
export const TOKEN_ADDRESSES = {
  USDT: "0x55d398326f99059fF775485246999027B3197955", // 18 decimals
  USDB: "0x4050334836d59C1276068e496aB239DC80247675", // 18 decimals
  BAM: "0xA779f03b752fa2442e6A23f145b007f2160F9a7D",  // 18 decimals
  BNB: "0x0000000000000000000000000000000000000000", // Native BNB, 18 decimals
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

// Use the V2 ABI we defined  
import { BAMSWAP_V2_ABI } from './bamswap-v2-abi';

// Export the ABI with proper typing
export const BAM_SWAP_ABI = BAMSWAP_V2_ABI;
export const COMPLETE_BAM_SWAP_ABI = BAMSWAP_V2_ABI;

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

// Import token icons
import usdtIcon from '@assets/usdtToken_1753039099297.png';
import usdbIcon from '@assets/USBDtoken_1753039099297.png';
import bamIcon from '@assets/bamToken_1753039099296.png';
import bnbIcon from '@assets/bnbCoin_1753039099295.png';

// Token Information
export const TOKENS = {
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    address: TOKEN_ADDRESSES.USDT,
    icon: usdtIcon
  },
  USDB: {
    symbol: "USDB",
    name: "USDB Token",
    decimals: 18,
    address: TOKEN_ADDRESSES.USDB,
    icon: usdbIcon
  },
  BAM: {
    symbol: "BAM",
    name: "Build And Multiply",
    decimals: 18,
    address: TOKEN_ADDRESSES.BAM,
    icon: bamIcon
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    decimals: 18,
    address: TOKEN_ADDRESSES.BNB,
    icon: bnbIcon
  }
} as const;

// Fee Information
export const FEES = {
  LOW_FEE: 0.5, // 0.5% for USDT→USDB, USDT→BAM, BNB→BAM
  HIGH_FEE: 1.5, // 1.5% for USDB→USDT, BAM→USDT, BAM→BNB
} as const;

