import { ethers } from 'ethers';

// Chainlink Price Feed ABI (minimal for price reading)
const PRICE_FEED_ABI = [
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      { "internalType": "uint80", "name": "roundId", "type": "uint80" },
      { "internalType": "int256", "name": "price", "type": "int256" },
      { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
      { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
      { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// BSC Chainlink Price Feeds
const PRICE_FEEDS = {
  BNB_USD: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE', // BNB/USD on BSC
  ETH_USD: '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e', // ETH/USD on BSC
  BTC_USD: '0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf'  // BTC/USD on BSC
};

// BSC RPC endpoints
const BSC_RPC_URLS = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org', 
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed2.defibit.io'
];

export class ChainlinkPriceService {
  private provider: ethers.JsonRpcProvider | null = null;
  private currentRpcIndex = 0;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(BSC_RPC_URLS[this.currentRpcIndex]);
    } catch (error) {
      console.error('Failed to initialize BSC provider:', error);
      this.provider = null;
    }
  }

  private async switchRpcProvider(): Promise<boolean> {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % BSC_RPC_URLS.length;
    
    if (this.currentRpcIndex === 0) {
      // We've tried all providers
      return false;
    }

    console.log(`Switching to RPC provider: ${BSC_RPC_URLS[this.currentRpcIndex]}`);
    this.initializeProvider();
    return true;
  }

  async getBNBPrice(): Promise<{ price: number; source: string; timestamp: number } | null> {
    if (!this.provider) {
      console.error('No provider available for Chainlink');
      return null;
    }

    let attempts = 0;
    const maxAttempts = BSC_RPC_URLS.length;

    while (attempts < maxAttempts) {
      try {
        const priceFeed = new ethers.Contract(
          PRICE_FEEDS.BNB_USD,
          PRICE_FEED_ABI,
          this.provider
        );

        // Get latest price data
        const [roundId, price, startedAt, updatedAt, answeredInRound] = await priceFeed.latestRoundData();
        const decimals = await priceFeed.decimals();

        // Convert price to USD (Chainlink prices have 8 decimals)
        const priceInUsd = parseFloat(ethers.formatUnits(price, decimals));
        const timestamp = Number(updatedAt) * 1000; // Convert to milliseconds

        // Validate price is reasonable for BNB
        if (priceInUsd > 100 && priceInUsd < 2000) {
          console.log(`✅ Chainlink BNB/USD: $${priceInUsd.toFixed(2)} (Updated: ${new Date(timestamp).toISOString()})`);
          return {
            price: priceInUsd,
            source: `Chainlink (BSC RPC ${this.currentRpcIndex + 1})`,
            timestamp
          };
        } else {
          console.warn(`Invalid Chainlink price: $${priceInUsd}`);
          throw new Error(`Invalid price range: $${priceInUsd}`);
        }

      } catch (error) {
        console.error(`Chainlink attempt ${attempts + 1} failed:`, error);
        attempts++;

        if (attempts < maxAttempts) {
          const switched = await this.switchRpcProvider();
          if (!switched) {
            break;
          }
        }
      }
    }

    console.error('All Chainlink RPC providers failed');
    return null;
  }

  // Get multiple prices in parallel
  async getAllPrices(): Promise<{
    bnb: { price: number; source: string; timestamp: number } | null;
  }> {
    const bnbPrice = await this.getBNBPrice();
    
    return {
      bnb: bnbPrice
    };
  }

  // Health check for the service
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.provider) return false;
      
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber > 0;
    } catch (error) {
      console.error('Chainlink health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const chainlinkService = new ChainlinkPriceService();