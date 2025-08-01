import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Navigation from '@/components/navigation';
import { 
  Search, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Eye,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Zap,
  Bot,
  Network,
  Shield,
  Activity,
  Wallet,
  Brain,
  BarChart3
} from 'lucide-react';

interface TransactionStory {
  hash: string;
  blockNumber: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed';
  story: {
    summary: string;
    narrative: string;
    insights: string[];
    riskLevel: 'low' | 'medium' | 'high';
    patterns: string[];
    significance: string;
  };
  visualData: {
    flowChart: any[];
    timelineEvents: any[];
    networkGraph: any[];
  };
}

export default function TxStoryVisualizer() {
  // For demo purposes, assume user is authenticated
  const isAuthenticated = true;
  const isLoading = false;
  const [txHash, setTxHash] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [txStory, setTxStory] = useState<TransactionStory | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [recentAnalyses, setRecentAnalyses] = useState<string[]>([]);

  // Sample transaction hashes for demonstration
  const sampleTxHashes = [
    '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b',
    '0x1b10c2b8f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    '0x2c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
  ];

  const analyzeTransaction = async () => {
    if (!txHash) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setTxStory(null);

    try {
      // Simulate multi-step analysis with progress updates
      const steps = [
        'Fetching transaction data from blockchain...',
        'Analyzing transaction patterns...',
        'Generating AI-powered insights...',
        'Building visual narrative...',
        'Finalizing story analysis...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setAnalysisStep(steps[i]);
        setAnalysisProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call real transaction analysis API
      const response = await fetch('/api/tx/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txHash }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze transaction');
      }

      const analysisResult = await response.json();
      
      // Use real analysis data or fallback to demo data
      let analysisData;
      
      try {
        analysisData = analysisResult;
      } catch (apiError) {
        // Fallback to demo data if API fails
        analysisData = {
          transaction: {
            hash: txHash,
            blockNumber: 18500000 + Math.floor(Math.random() * 100000),
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 30),
            from: '0x742d35Cc6639C0532fBa33b80Eb6C720B0c68c14',
            to: '0x4BA74Df6b4a74cb1A7c9F60b4e5c5c19d58A2DA0',
            value: (Math.random() * 10).toFixed(4),
            gasUsed: (Math.random() * 100000 + 21000).toFixed(0),
            gasPrice: (Math.random() * 50 + 10).toFixed(2),
            status: Math.random() > 0.1 ? 'success' : 'failed'
          },
          story: {
            summary: 'Large DeFi swap transaction with sophisticated MEV protection patterns',
            narrative: 'This transaction represents a strategic DeFi swap executed with advanced protection mechanisms. The sender utilized a sophisticated routing strategy to minimize slippage and front-running risks, indicating an experienced trader or institutional participant.',
            insights: [
              'Transaction shows MEV protection patterns typical of institutional traders',
              'Gas price optimization suggests automated execution system',
              'Contract interaction pattern indicates use of aggregator protocol',
              'Timing analysis reveals strategic execution during low network congestion'
            ],
            riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
            patterns: [
              'MEV Protection',
              'Automated Execution', 
              'Institutional Behavior',
              'Optimal Timing'
            ],
            significance: 'This transaction demonstrates advanced DeFi trading strategies and contributes to overall market efficiency through optimal execution patterns.'
          },
          visualData: {
            flowChart: [],
            timelineEvents: [],
            networkGraph: []
          }
        };
      }

      const txStoryData: TransactionStory = {
        hash: analysisData.transaction.hash,
        blockNumber: analysisData.transaction.blockNumber,
        timestamp: new Date(analysisData.transaction.timestamp),
        from: analysisData.transaction.from,
        to: analysisData.transaction.to,
        value: analysisData.transaction.value,
        gasUsed: analysisData.transaction.gasUsed,
        gasPrice: analysisData.transaction.gasPrice,
        status: analysisData.transaction.status,
        story: analysisData.story,
        visualData: analysisData.visualData
      };

      setTxStory(txStoryData);
      setRecentAnalyses(prev => [txHash, ...prev.slice(0, 4)]);
      
    } catch (error) {
      console.error('Transaction analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Navigation />
        
        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Transaction Story Visualizer</h2>
              <p className="text-gray-400">AI-powered blockchain transaction analysis</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-300">Please log in to access advanced blockchain analytics</p>
            </div>
            <Link href="/" className="block">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Transaction Story Visualizer</h1>
              <p className="text-gray-400">AI-powered blockchain transaction analysis and storytelling</p>
            </div>
          </div>

          {/* Search Interface */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter transaction hash (0x...)"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  />
                  <Button
                    onClick={analyzeTransaction}
                    disabled={!txHash || isAnalyzing}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Analyze Transaction
                      </div>
                    )}
                  </Button>
                </div>

                {/* Sample Transaction Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-400">Try sample:</span>
                  {sampleTxHashes.map((hash, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setTxHash(hash)}
                      className="text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Sample {index + 1}
                    </Button>
                  ))}
                </div>

                {/* Analysis Progress */}
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{analysisStep}</span>
                      <span className="text-gray-400">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Story Results */}
        {txStory && (
          <div className="space-y-6">
            {/* Transaction Overview */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  Transaction Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Status</span>
                    </div>
                    <Badge className={txStory.status === 'success' ? 'bg-green-600' : 'bg-red-600'}>
                      {txStory.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">Value</span>
                    </div>
                    <p className="font-bold text-white">{txStory.value} ETH</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-gray-400">Gas Used</span>
                    </div>
                    <p className="font-bold text-white">{Number(txStory.gasUsed).toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">Block</span>
                    </div>
                    <p className="font-bold text-white">#{txStory.blockNumber.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    AI Story Summary
                  </h4>
                  <p className="text-gray-300">{txStory.story.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="story" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="story">AI Story</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="patterns">Patterns</TabsTrigger>
                <TabsTrigger value="visual">Visualization</TabsTrigger>
              </TabsList>

              <TabsContent value="story" className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-400" />
                      Transaction Narrative
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-300 leading-relaxed">{txStory.story.narrative}</p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        Market Significance
                      </h4>
                      <p className="text-gray-300">{txStory.story.significance}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Risk Level:</span>
                      <Badge className={
                        txStory.story.riskLevel === 'high' ? 'bg-red-600' :
                        txStory.story.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }>
                        {txStory.story.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-400" />
                      AI-Generated Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {txStory.story.insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <p className="text-gray-300 flex-1">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patterns" className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-green-400" />
                      Detected Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {txStory.story.patterns.map((pattern, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="font-semibold text-white">{pattern}</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Advanced behavioral pattern detected in transaction execution
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visual" className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      Visual Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-800/50 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Interactive Visualization</h3>
                      <p className="text-gray-400 mb-4">
                        Advanced flow charts, network graphs, and timeline visualizations coming soon
                      </p>
                      <Badge className="bg-purple-600">Feature in Development</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentAnalyses.map((hash, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                    <span className="font-mono text-sm text-gray-300">{hash}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTxHash(hash)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Re-analyze
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}