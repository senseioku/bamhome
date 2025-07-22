// BAMSwapV2 Utility Functions for Deployed Contract
import Web3 from 'web3';
import { BAM_SWAP_ADDRESS } from './contracts';

// Simple ABI for the functions we need to test
const BAMSWAP_V2_ABI = [
  {
    "inputs": [],
    "name": "bamPriceInUSD",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPurchaseInfo", 
    "outputs": [
      {"internalType": "uint256", "name": "minPurchase", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPurchase", "type": "uint256"},
      {"internalType": "uint256", "name": "maxPerWallet", "type": "uint256"},
      {"internalType": "uint256", "name": "currentBAMPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "bamPerUSDT", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "walletPurchases",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
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
  }
];

// Initialize Web3 with BSC - use multiple RPC endpoints for reliability
const BSC_RPC_ENDPOINTS = [
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed3.binance.org/',
  'https://rpc.ankr.com/bsc'
];

// Create Web3 instance with fallback providers
const createWeb3Instance = () => {
  for (const endpoint of BSC_RPC_ENDPOINTS) {
    try {
      return new Web3(endpoint);
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint}:`, error);
      continue;
    }
  }
  throw new Error('All BSC RPC endpoints failed');
};

const web3 = createWeb3Instance();

// Create contract instance
const bamSwapContract = new web3.eth.Contract(BAMSWAP_V2_ABI, BAM_SWAP_ADDRESS);

// Utility functions to interact with deployed BAMSwapV2 contract
export class BAMSwapV2Utils {
  
  /**
   * Get purchase information from deployed contract
   */
  static async getPurchaseInfo() {
    try {
      const result: any = await bamSwapContract.methods.getPurchaseInfo().call();
      return {
        minPurchase: result[0] || '2000000000000000000',
        maxPurchase: result[1] || '5000000000000000000', 
        maxPerWallet: result[2] || '5000000000000000000',
        currentBAMPrice: result[3] || '1000000000000',
        bamPerUSDT: result[4] || '1000000000000000000000000'
      };
    } catch (error) {
      console.error('Error getting purchase info:', error);
      return {
        minPurchase: '2000000000000000000', // 2 USDT fallback
        maxPurchase: '5000000000000000000', // 5 USDT fallback
        maxPerWallet: '5000000000000000000', // 5 USDT fallback
        currentBAMPrice: '1000000000000', // $0.000001 fallback
        bamPerUSDT: '1000000000000000000000000' // 1M BAM fallback
      };
    }
  }

  /**
   * Get current BAM price from deployed contract
   */
  static async getBAMPrice() {
    try {
      const result = await bamSwapContract.methods.bamPriceInUSD().call();
      return result;
    } catch (error) {
      console.error('Error getting BAM price:', error);
      return '1000000000000'; // $0.000001 fallback
    }
  }

  /**
   * Check if wallet has already purchased
   */
  static async getWalletPurchases(walletAddress: string) {
    try {
      const result = await bamSwapContract.methods.walletPurchases(walletAddress).call();
      return result;
    } catch (error) {
      console.error('Error getting wallet purchases:', error);
      return '0';
    }
  }

  /**
   * Test contract connectivity
   */
  static async testContract() {
    try {
      console.log('Testing deployed contract:', BAM_SWAP_ADDRESS);
      
      // Test BAM price
      const bamPrice = await this.getBAMPrice();
      console.log('BAM Price (wei):', bamPrice);
      console.log('BAM Price (formatted):', this.formatBAMPrice(bamPrice));
      
      // Test purchase info
      const purchaseInfo = await this.getPurchaseInfo();
      console.log('Purchase Info:', purchaseInfo);
      
      // Test wallet purchases for zero address
      const walletPurchases = await this.getWalletPurchases('0x0000000000000000000000000000000000000000');
      console.log('Test wallet purchases:', walletPurchases);
      
      return {
        isWorking: true,
        bamPrice,
        purchaseInfo,
        walletPurchases
      };
    } catch (error) {
      console.error('Contract test failed:', error);
      return {
        isWorking: false,
        error: error.message
      };
    }
  }

  /**
   * Format contract values for display
   */
  static formatContractValue(value: string, decimals: number = 18): string {
    const num = parseFloat(Web3.utils.fromWei(value, 'ether'));
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toFixed(decimals >= 6 ? 6 : 2);
    }
  }

  /**
   * Format BAM price for display
   */
  static formatBAMPrice(priceInWei: string): string {
    const price = parseFloat(Web3.utils.fromWei(priceInWei, 'ether'));
    return price.toFixed(7); // Show 7 decimal places for BAM price
  }
}

export default BAMSwapV2Utils;