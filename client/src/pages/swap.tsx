import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Settings, RefreshCw, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { web3Utils, ContractEncoder } from '@/lib/web3';
import { BAM_SWAP_ADDRESS, TOKENS, FEES, TOKEN_ADDRESSES, ERC20_ABI } from '@/lib/contracts';

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  icon: string;
  balance?: string;
  price?: number;
}

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  fee: string;
  feePercentage: number;
  priceImpact: number;
  minimumReceived: string;
  route: string[];
}

interface PriceInfo {
  bnbPrice: number;
  bamPrice: number;
  isValidPrice: boolean;
  lastUpdated: number;
}

const SwapPage: React.FC = () => {
  // State Management
  const [fromToken, setFromToken] = useState<TokenInfo>(TOKENS.USDT);
  const [toToken, setToToken] = useState<TokenInfo>(TOKENS.BAM);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Token balances
  const [balances, setBalances] = useState<Record<string, string>>({});

  // Price Update Timer
  useEffect(() => {
    const updatePrices = async () => {
      try {
        const contractInfo = await getContractInfo();
        if (contractInfo) {
          setPriceInfo({
            bnbPrice: parseFloat(web3Utils.fromWei(contractInfo[4])),
            bamPrice: parseFloat(web3Utils.fromWei(contractInfo[5])) / 1e18,
            isValidPrice: contractInfo[6],
            lastUpdated: Date.now()
          });
        }
      } catch (err) {
        console.error('Failed to update prices:', err);
      }
    };

    updatePrices();
    const interval = setInterval(updatePrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Get contract information
  const getContractInfo = async () => {
    try {
      const data = ContractEncoder.encodeFunctionCall('getContractInfo()');
      const result = await web3Utils.callContract(BAM_SWAP_ADDRESS, data);
      return ContractEncoder.decodeResult(result, 'tuple');
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const address = await web3Utils.connectWallet();
      setWalletAddress(address);
      await updateBalances(address);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Update token balances
  const updateBalances = async (address: string) => {
    const newBalances: Record<string, string> = {};
    
    try {
      // Get BNB balance
      const bnbBalance = await web3Utils.getBalance(address);
      newBalances.BNB = bnbBalance;

      // Get token balances
      for (const [symbol, token] of Object.entries(TOKENS)) {
        if (symbol !== 'BNB') {
          const balance = await web3Utils.getBalance(address, token.address);
          newBalances[symbol] = balance;
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to update balances:', error);
    }
  };

  // Calculate swap quote
  const calculateQuote = useCallback(async (amount: string, from: TokenInfo, to: TokenInfo) => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      setToAmount('');
      return;
    }

    try {
      let outputAmount = '0';
      let feePercentage = 0;
      let route: string[] = [from.symbol, to.symbol];

      // Different swap calculations based on token pair
      if (from.symbol === 'USDT' && to.symbol === 'USDB') {
        // USDT to USDB: 0.5% fee, user receives reduced USDB
        feePercentage = FEES.LOW_FEE;
        const fee = parseFloat(amount) * (feePercentage / 100);
        outputAmount = (parseFloat(amount) - fee).toString();
      } else if (from.symbol === 'USDB' && to.symbol === 'USDT') {
        // USDB to USDT: 1.5% fee
        feePercentage = FEES.HIGH_FEE;
        const fee = parseFloat(amount) * (feePercentage / 100);
        outputAmount = (parseFloat(amount) - fee).toString();
      } else if (from.symbol === 'USDT' && to.symbol === 'BAM') {
        // USDT to BAM: Fixed price $0.0000001
        feePercentage = FEES.LOW_FEE;
        const bamPrice = 0.0000001;
        outputAmount = (parseFloat(amount) / bamPrice).toString();
      } else if (from.symbol === 'BNB' && to.symbol === 'BAM') {
        // BNB to BAM: Using live BNB price
        feePercentage = FEES.LOW_FEE;
        if (priceInfo) {
          const usdValue = parseFloat(amount) * priceInfo.bnbPrice;
          const bamPrice = 0.0000001;
          outputAmount = (usdValue / bamPrice).toString();
        }
      } else if (from.symbol === 'BAM' && to.symbol === 'USDT') {
        // BAM to USDT: 1.5% fee
        feePercentage = FEES.HIGH_FEE;
        const bamPrice = 0.0000001;
        const usdtValue = parseFloat(amount) * bamPrice;
        const fee = usdtValue * (feePercentage / 100);
        outputAmount = (usdtValue - fee).toString();
      } else if (from.symbol === 'BAM' && to.symbol === 'BNB') {
        // BAM to BNB: 1.5% fee
        feePercentage = FEES.HIGH_FEE;
        if (priceInfo) {
          const bamPrice = 0.0000001;
          const usdValue = parseFloat(amount) * bamPrice;
          const fee = usdValue * (feePercentage / 100);
          const bnbValue = (usdValue - fee) / priceInfo.bnbPrice;
          outputAmount = bnbValue.toString();
        }
      }

      const fee = parseFloat(amount) * (feePercentage / 100);
      const minimumReceived = parseFloat(outputAmount) * (1 - slippage / 100);

      setQuote({
        inputAmount: amount,
        outputAmount: outputAmount,
        fee: fee.toString(),
        feePercentage,
        priceImpact: 0.1, // Minimal price impact for our fixed-price swaps
        minimumReceived: minimumReceived.toString(),
        route
      });

      setToAmount(parseFloat(outputAmount).toFixed(6));
    } catch (error) {
      console.error('Failed to calculate quote:', error);
      setQuote(null);
    }
  }, [priceInfo, slippage]);

  // Handle amount changes
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      calculateQuote(fromAmount, fromToken, toToken);
    }
  }, [fromAmount, fromToken, toToken, calculateQuote]);

  // Swap tokens (flip from/to)
  const swapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // Execute swap transaction
  const executeSwap = async () => {
    if (!walletAddress || !quote) return;

    try {
      setIsLoading(true);
      setTxStatus('pending');
      setError('');

      let txHash = '';
      const amountWei = web3Utils.toWei(fromAmount);

      // Different swap functions based on token pair
      if (fromToken.symbol === 'USDT' && toToken.symbol === 'USDB') {
        // First approve USDT
        await approveToken(TOKEN_ADDRESSES.USDT, amountWei);
        // Then execute swap
        const data = ContractEncoder.encodeFunctionCall('swapUSDTToUSDB(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'USDB' && toToken.symbol === 'USDT') {
        await approveToken(TOKEN_ADDRESSES.USDB, amountWei);
        const data = ContractEncoder.encodeFunctionCall('swapUSDBToUSDT(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') {
        await approveToken(TOKEN_ADDRESSES.USDT, amountWei);
        const data = ContractEncoder.encodeFunctionCall('buyBAMWithUSDT(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM') {
        const data = ContractEncoder.encodeFunctionCall('buyBAMWithBNB()');
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          value: amountWei,
          from: walletAddress
        });
      }

      setTxHash(txHash);
      setTxStatus('success');
      
      // Update balances after successful transaction
      setTimeout(() => updateBalances(walletAddress), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setTxStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Approve token spending
  const approveToken = async (tokenAddress: string, amount: string) => {
    const data = ContractEncoder.encodeFunctionCall('approve(address,uint256)', [BAM_SWAP_ADDRESS, amount]);
    await web3Utils.sendTransaction({
      to: tokenAddress,
      data,
      from: walletAddress
    });
  };

  // Token selector component
  const TokenSelector = ({ token, onSelect, label }: { token: TokenInfo; onSelect: (token: TokenInfo) => void; label: string }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="text-2xl">{token.icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-white">{token.symbol}</div>
        <div className="text-sm text-gray-400">{token.name}</div>
        {balances[token.symbol] && (
          <div className="text-xs text-gray-500">
            Balance: {web3Utils.formatAmount(balances[token.symbol])}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">BAM Swap</h1>
          <p className="text-gray-400">Professional DeFi Trading Interface</p>
          {priceInfo && (
            <div className="flex justify-center items-center space-x-4 mt-4 text-sm">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                BNB ${priceInfo.bnbPrice.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                <Activity className="w-3 h-3 mr-1" />
                BAM $0.0000001
              </Badge>
            </div>
          )}
        </div>

        {/* Main Swap Card */}
        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Header with Settings */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Swap</h2>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => priceInfo && calculateQuote(fromAmount, fromToken, toToken)}
                        className="text-gray-400 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh Price</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Swap Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300">Slippage Tolerance</label>
                        <div className="flex items-center space-x-2 mt-2">
                          {[0.1, 0.5, 1.0].map((value) => (
                            <Button
                              key={value}
                              variant={slippage === value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSlippage(value)}
                              className="text-xs"
                            >
                              {value}%
                            </Button>
                          ))}
                          <Input
                            type="number"
                            value={slippage}
                            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                            className="w-20 text-center text-xs bg-gray-800 border-gray-600"
                            step="0.1"
                            min="0.1"
                            max="50"
                          />
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">From</label>
                {balances[fromToken.symbol] && (
                  <button
                    onClick={() => setFromAmount(balances[fromToken.symbol])}
                    className="text-xs text-yellow-400 hover:text-yellow-300"
                  >
                    Max: {web3Utils.formatAmount(balances[fromToken.symbol])}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="text-2xl font-bold bg-gray-800/50 border-gray-700 text-white h-16 pr-32"
                  step="any"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <TokenSelector token={fromToken} onSelect={setFromToken} label="from" />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={swapTokens}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium text-gray-300">To</label>
              <div className="relative">
                <Input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="text-2xl font-bold bg-gray-800/50 border-gray-700 text-white h-16 pr-32"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <TokenSelector token={toToken} onSelect={setToToken} label="to" />
                </div>
              </div>
            </div>

            {/* Quote Information */}
            {quote && (
              <div className="bg-gray-800/30 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee ({quote.feePercentage}%)</span>
                  <span className="text-white">{web3Utils.formatAmount(quote.fee)} {fromToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Minimum Received</span>
                  <span className="text-white">{web3Utils.formatAmount(quote.minimumReceived)} {toToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price Impact</span>
                  <span className="text-green-400">&lt; {quote.priceImpact}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Route</span>
                  <span className="text-white">{quote.route.join(' → ')}</span>
                </div>
              </div>
            )}

            {/* Connect/Swap Button */}
            {!walletAddress ? (
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
              >
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <Button
                onClick={executeSwap}
                disabled={!quote || isLoading || !fromAmount || parseFloat(fromAmount) <= 0}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Swap ${fromToken.symbol} for ${toToken.symbol}`
                )}
              </Button>
            )}

            {/* Transaction Status */}
            {txStatus !== 'idle' && (
              <div className="mt-4">
                {txStatus === 'pending' && (
                  <Alert className="border-yellow-500 bg-yellow-500/10">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-300">
                      Transaction pending... Please wait.
                    </AlertDescription>
                  </Alert>
                )}
                {txStatus === 'success' && (
                  <Alert className="border-green-500 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-300">
                      Swap successful! 
                      {txHash && (
                        <a
                          href={`https://bscscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 underline hover:text-green-200"
                        >
                          View on BSCScan
                        </a>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {txStatus === 'error' && (
                  <Alert className="border-red-500 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-300">
                      {error || 'Transaction failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && txStatus === 'idle' && (
              <Alert className="mt-4 border-red-500 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>🔒 Powered by BAM Smart Contracts on BSC</p>
          <p>💎 Professional-grade DeFi with minimal fees</p>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;