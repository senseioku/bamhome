import Web3 from 'web3';
import { ethers } from 'ethers';
import { aiService } from './ai';

interface TransactionData {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  input: string;
  logs: any[];
}

interface TransactionStory {
  summary: string;
  narrative: string;
  insights: string[];
  riskLevel: 'low' | 'medium' | 'high';
  patterns: string[];
  significance: string;
}

interface AnalysisResult {
  transaction: TransactionData;
  story: TransactionStory;
  visualData: {
    flowChart: any[];
    timelineEvents: any[];
    networkGraph: any[];
  };
  metadata: {
    analysisTimestamp: Date;
    confidence: number;
    sources: string[];
  };
}

class BlockchainAnalyticsService {
  private web3: Web3;
  private provider: ethers.JsonRpcProvider;
  private bscScanApiKey: string;

  constructor() {
    // Initialize Web3 with BSC mainnet
    this.web3 = new Web3('https://bsc-dataseed1.binance.org/');
    this.provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    this.bscScanApiKey = process.env.BSCSCAN_API_KEY || '';
  }

  async analyzeTransaction(txHash: string): Promise<AnalysisResult> {
    try {
      // Fetch transaction data
      const transactionData = await this.fetchTransactionData(txHash);
      
      // Generate AI-powered story
      const story = await this.generateTransactionStory(transactionData);
      
      // Create visualization data
      const visualData = await this.generateVisualizationData(transactionData);
      
      return {
        transaction: transactionData,
        story,
        visualData,
        metadata: {
          analysisTimestamp: new Date(),
          confidence: this.calculateConfidenceScore(transactionData),
          sources: ['BSCScan API', 'Blockchain RPC', 'AI Analysis']
        }
      };
    } catch (error: any) {
      console.error('Transaction analysis failed:', error);
      throw new Error(`Failed to analyze transaction: ${error.message}`);
    }
  }

  private async fetchTransactionData(txHash: string): Promise<TransactionData> {
    try {
      // Fetch transaction from blockchain
      const tx = await this.web3.eth.getTransaction(txHash);
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      if (!tx || !receipt) {
        throw new Error('Transaction not found');
      }

      // Get block data for timestamp
      const block = await this.web3.eth.getBlock(tx.blockNumber!);
      
      return {
        hash: txHash,
        blockNumber: Number(tx.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
        from: tx.from,
        to: tx.to || '',
        value: this.web3.utils.fromWei(tx.value, 'ether'),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: this.web3.utils.fromWei(tx.gasPrice || '0', 'gwei'),
        status: receipt.status ? 'success' : 'failed',
        input: tx.input,
        logs: receipt.logs
      };
    } catch (error) {
      console.error('Failed to fetch transaction data:', error);
      throw error;
    }
  }

  private async generateTransactionStory(txData: TransactionData): Promise<TransactionStory> {
    try {
      // Analyze transaction patterns
      const patterns = this.detectTransactionPatterns(txData);
      const riskLevel = this.assessRiskLevel(txData, patterns);
      
      // Generate AI narrative
      const prompt = this.buildAnalysisPrompt(txData, patterns);
      const aiResponse = await aiService.chat([
        { role: 'user', content: prompt }
      ], 'crypto');

      // Parse AI response to extract structured story
      const story = this.parseAIStoryResponse(aiResponse.message, patterns, riskLevel);
      
      return story;
    } catch (error) {
      console.error('Failed to generate transaction story:', error);
      // Fallback to basic analysis
      return this.generateBasicStory(txData);
    }
  }

  private detectTransactionPatterns(txData: TransactionData): string[] {
    const patterns: string[] = [];
    
    // Analyze gas usage patterns
    const gasUsed = Number(txData.gasUsed);
    if (gasUsed > 200000) {
      patterns.push('Complex Contract Interaction');
    } else if (gasUsed === 21000) {
      patterns.push('Simple Transfer');
    } else if (gasUsed > 50000) {
      patterns.push('Token Transfer');
    }

    // Analyze gas price for MEV protection
    const gasPrice = Number(txData.gasPrice);
    if (gasPrice > 20) {
      patterns.push('High Priority Transaction');
    } else if (gasPrice > 10) {
      patterns.push('MEV Protection');
    }

    // Analyze transaction value
    const value = Number(txData.value);
    if (value > 10) {
      patterns.push('Large Value Transfer');
    } else if (value > 1) {
      patterns.push('Medium Value Transfer');
    }

    // Analyze contract interaction
    if (txData.input && txData.input !== '0x') {
      patterns.push('Smart Contract Call');
      
      // Check for common DeFi patterns
      if (txData.input.includes('swap') || txData.logs.length > 2) {
        patterns.push('DeFi Protocol Interaction');
      }
    }

    // Analyze timing patterns
    const hour = txData.timestamp.getUTCHours();
    if (hour >= 2 && hour <= 6) {
      patterns.push('Off-Peak Execution');
    } else if (hour >= 14 && hour <= 18) {
      patterns.push('Peak Trading Hours');
    }

    return patterns;
  }

  private assessRiskLevel(txData: TransactionData, patterns: string[]): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // High value increases risk
    if (Number(txData.value) > 100) riskScore += 3;
    else if (Number(txData.value) > 10) riskScore += 2;
    else if (Number(txData.value) > 1) riskScore += 1;

    // Failed transactions are risky
    if (txData.status === 'failed') riskScore += 4;

    // Complex interactions have moderate risk
    if (patterns.includes('Complex Contract Interaction')) riskScore += 2;
    if (patterns.includes('DeFi Protocol Interaction')) riskScore += 1;

    // MEV protection reduces risk
    if (patterns.includes('MEV Protection')) riskScore -= 1;

    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private buildAnalysisPrompt(txData: TransactionData, patterns: string[]): string {
    return `Analyze this blockchain transaction and provide insights:

Transaction Hash: ${txData.hash}
From: ${txData.from}
To: ${txData.to}
Value: ${txData.value} BNB
Gas Used: ${txData.gasUsed}
Gas Price: ${txData.gasPrice} Gwei
Status: ${txData.status}
Detected Patterns: ${patterns.join(', ')}

Please provide:
1. A concise summary of what this transaction represents
2. A detailed narrative explaining the transaction's purpose and context
3. Key insights about the transaction behavior and significance
4. Assessment of market or ecosystem impact

Focus on:
- Transaction purpose and strategy
- User behavior analysis
- Market efficiency implications
- Technical execution quality
- Risk assessment factors

Respond in a professional, analytical tone suitable for blockchain researchers.`;
  }

  private parseAIStoryResponse(aiResponse: string, patterns: string[], riskLevel: 'low' | 'medium' | 'high'): TransactionStory {
    // Extract insights from AI response
    const insights = this.extractInsights(aiResponse);
    
    // Generate summary and narrative
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const summary = lines[0] || 'Transaction analysis completed';
    const narrative = lines.slice(1, 4).join(' ') || 'Detailed transaction analysis performed using blockchain data and AI insights.';
    
    // Determine significance
    const significance = this.generateSignificance(patterns, riskLevel);
    
    return {
      summary,
      narrative,
      insights,
      riskLevel,
      patterns,
      significance
    };
  }

  private extractInsights(aiResponse: string): string[] {
    const insights: string[] = [];
    
    // Look for numbered insights or bullet points
    const lines = aiResponse.split('\n');
    for (const line of lines) {
      if (line.match(/^\d+\./) || line.startsWith('•') || line.startsWith('-')) {
        insights.push(line.replace(/^\d+\.\s*|^[•-]\s*/, '').trim());
      }
    }
    
    // If no structured insights found, extract key sentences
    if (insights.length === 0) {
      const sentences = aiResponse.split('. ');
      sentences.slice(0, 4).forEach(sentence => {
        if (sentence.length > 20 && sentence.length < 200) {
          insights.push(sentence.trim());
        }
      });
    }
    
    return insights.slice(0, 6); // Limit to 6 insights
  }

  private generateSignificance(patterns: string[], riskLevel: 'low' | 'medium' | 'high'): string {
    if (patterns.includes('DeFi Protocol Interaction')) {
      return 'This transaction contributes to DeFi ecosystem liquidity and demonstrates advanced protocol utilization patterns.';
    } else if (patterns.includes('Large Value Transfer')) {
      return 'This high-value transaction indicates significant capital movement and potential market impact.';
    } else if (patterns.includes('MEV Protection')) {
      return 'This transaction demonstrates sophisticated MEV protection strategies, contributing to market efficiency.';
    } else {
      return 'This transaction represents standard blockchain usage patterns and contributes to network activity.';
    }
  }

  private generateBasicStory(txData: TransactionData): TransactionStory {
    const isHighValue = Number(txData.value) > 1;
    const isContract = txData.input && txData.input !== '0x';
    
    return {
      summary: isHighValue ? 'High-value blockchain transaction' : 'Standard blockchain transaction',
      narrative: `This transaction ${txData.status === 'success' ? 'successfully' : 'unsuccessfully'} transferred ${txData.value} BNB ${isContract ? 'through smart contract interaction' : 'directly'} on the BSC network.`,
      insights: [
        `Transaction processed in block ${txData.blockNumber}`,
        `Gas efficiency: ${Number(txData.gasUsed) < 50000 ? 'High' : 'Standard'}`,
        `Execution status: ${txData.status.toUpperCase()}`,
        `Network fee: ${Number(txData.gasPrice)} Gwei`
      ],
      riskLevel: this.assessRiskLevel(txData, []),
      patterns: this.detectTransactionPatterns(txData),
      significance: 'Standard blockchain network participation contributing to overall ecosystem activity.'
    };
  }

  private async generateVisualizationData(txData: TransactionData): Promise<any> {
    return {
      flowChart: [
        { id: 'sender', label: this.shortenAddress(txData.from), type: 'address' },
        { id: 'transaction', label: `${txData.value} BNB`, type: 'transfer' },
        { id: 'receiver', label: this.shortenAddress(txData.to), type: 'address' }
      ],
      timelineEvents: [
        {
          timestamp: txData.timestamp,
          event: 'Transaction Initiated',
          details: `From ${this.shortenAddress(txData.from)}`
        },
        {
          timestamp: txData.timestamp,
          event: 'Transaction Executed',
          details: `Status: ${txData.status}`
        }
      ],
      networkGraph: []
    };
  }

  private calculateConfidenceScore(txData: TransactionData): number {
    let confidence = 80; // Base confidence
    
    if (txData.status === 'success') confidence += 10;
    if (Number(txData.gasUsed) > 0) confidence += 5;
    if (txData.logs.length > 0) confidence += 5;
    
    return Math.min(confidence, 100);
  }

  private shortenAddress(address: string): string {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const blockchainAnalytics = new BlockchainAnalyticsService();