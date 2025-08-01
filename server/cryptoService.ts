// Crypto news and updates service
interface CryptoNewsItem {
  title: string;
  summary: string;
  category: string;
  source: string;
  url?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  publishedAt: Date;
}

export class CryptoService {
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly NEWS_SOURCES = [
    'CoinDesk',
    'Cointelegraph', 
    'CoinGecko',
    'DeFiPulse',
    'The Block'
  ];

  async fetchLatestNews(category: string = 'all'): Promise<CryptoNewsItem[]> {
    // Simulated news data - in production, integrate with real APIs
    const sampleNews: CryptoNewsItem[] = [
      {
        title: "DeFi TVL Reaches New All-Time High",
        summary: "Total Value Locked in DeFi protocols surpasses $100B as institutional adoption continues to grow.",
        category: "defi",
        source: "DeFiPulse",
        sentiment: "positive",
        relevanceScore: 95,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: "Major Airdrop Announced for BAM Holders",
        summary: "BAM Ecosystem announces surprise airdrop distribution for long-term holders and active community members.",
        category: "airdrop",
        source: "BAM Official",
        sentiment: "positive",
        relevanceScore: 100,
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        title: "Web3 Gaming Sector Shows 200% Growth",
        summary: "Blockchain gaming platforms experience massive user growth as mainstream adoption accelerates.",
        category: "web3",
        source: "The Block",
        sentiment: "positive",
        relevanceScore: 80,
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        title: "New Regulatory Framework Proposed",
        summary: "Government officials outline comprehensive cryptocurrency regulation guidelines for 2025.",
        category: "regulatory",
        source: "CoinDesk",
        sentiment: "neutral",
        relevanceScore: 75,
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        title: "Layer 2 Solutions Gain Traction",
        summary: "Ethereum scaling solutions process record transaction volumes as gas fees remain low.",
        category: "technology",
        source: "Cointelegraph",
        sentiment: "positive",
        relevanceScore: 85,
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      }
    ];

    if (category === 'all') {
      return sampleNews;
    }

    return sampleNews.filter(item => item.category === category);
  }

  async fetchMarketData(): Promise<any> {
    try {
      // In production, fetch real market data
      return {
        btc: { price: 45000, change24h: 2.5 },
        eth: { price: 3200, change24h: 1.8 },
        bnb: { price: 692, change24h: 3.2 },
        bam: { price: 0.0000025, change24h: 15.7 }
      };
    } catch (error) {
      console.error('Market data fetch error:', error);
      return null;
    }
  }

  categorizeNews(content: string): string {
    const keywords = {
      defi: ['defi', 'decentralized finance', 'yield', 'liquidity', 'staking'],
      airdrop: ['airdrop', 'distribution', 'token drop', 'free tokens'],
      web3: ['web3', 'metaverse', 'nft', 'gaming', 'dao'],
      market: ['price', 'bull', 'bear', 'rally', 'correction'],
      technology: ['blockchain', 'layer 2', 'scaling', 'protocol', 'upgrade']
    };

    const contentLower = content.toLowerCase();
    
    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some(term => contentLower.includes(term))) {
        return category;
      }
    }

    return 'general';
  }

  calculateRelevanceScore(title: string, summary: string): number {
    const bamKeywords = ['bam', 'build and multiply', 'bsc', 'binance smart chain'];
    const content = `${title} ${summary}`.toLowerCase();
    
    let score = 50; // Base score
    
    // Boost for BAM-related content
    bamKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 25;
      }
    });

    // Boost for trending topics
    const trendingTerms = ['defi', 'airdrop', 'web3', 'yield', 'staking'];
    trendingTerms.forEach(term => {
      if (content.includes(term)) {
        score += 10;
      }
    });

    return Math.min(score, 100);
  }
}

export const cryptoService = new CryptoService();