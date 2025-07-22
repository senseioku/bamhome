// Clean version - removing all notifications outside swap interface
// Will copy back to swap.tsx once verified working

import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowDownUp, Settings, AlertCircle, CheckCircle, Info, Zap, TrendingUp, Activity, AlertTriangle, Wallet, ExternalLink, Home, Menu } from 'lucide-react';
import { Link } from 'wouter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TOKENS, BAM_SWAP_ADDRESS } from '@/lib/contracts';
import { COMPLETE_BAM_SWAP_ABI } from '@/lib/complete-bam-swap-abi';
import { web3Utils } from '@/lib/web3';
import { priceService } from '@/lib/price-service';

// Import token images
import bamTokenImg from '@assets/bamToken_1753182165828.png';
import bnbCoinImg from '@assets/bnbCoin_1753039099295.png';
import usdtTokenImg from '@assets/usdtToken_1753039099297.png';
import usdbTokenImg from '@assets/USBDtoken_1753039099297.png';

// Fee constants matching contract
const FEES = {
  LOW_FEE: 0.5,   // USDT→USDB, USDT→BAM, BNB→BAM
  HIGH_FEE: 1.5   // USDB→USDT, BAM→USDT, BAM→BNB
};

interface TokenInfo {
  symbol: string;
  name: string;
  address?: string;
  decimals: number;
  image?: string;
}

interface Quote {
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
  usdtPrice: number;
  usdbPrice: number;
  lastUpdated: Date;
}

interface ContractStatus {
  isPaused: boolean;
  functionPaused: {
    usdtToBam: boolean;
    bnbToBam: boolean;
    usdtToUsdb: boolean;
    usdbToUsdt: boolean;
    bamToUsdt: boolean;
    bamToBnb: boolean;
  };
  lastChecked: number;
}

type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

export default function BamSwap() {
  // State management
  const [fromToken, setFromToken] = useState<TokenInfo>(TOKENS.USDT);
  const [toToken, setToToken] = useState<TokenInfo>(TOKENS.BAM);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [error, setError] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [hasAlreadyPurchased, setHasAlreadyPurchased] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [contractBalances, setContractBalances] = useState<Record<string, string>>({});
  
  // Connect wallet
  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        setWalletAddress(accounts[0]);
        await updateBalances(accounts[0]);
        await checkPurchaseHistory(accounts[0]);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setError('Failed to connect wallet. Please try again.');
      }
    } else {
      setError('MetaMask is not installed. Please install it to continue.');
    }
  };

  // Update user balances
  const updateBalances = async (address: string) => {
    try {
      const newBalances: Record<string, string> = {};
      
      // Get BNB balance
      const bnbBalance = await web3Utils.getBalance(address);
      newBalances.BNB = bnbBalance;

      // Get token balances for each ERC20 token
      for (const [symbol, token] of Object.entries(TOKENS)) {
        if (symbol !== 'BNB' && token.address) {
          try {
            const balance = await web3Utils.getBalance(address, token.address);
            newBalances[symbol] = balance;
          } catch (error) {
            console.error(`Failed to get ${symbol} balance:`, error);
            newBalances[symbol] = '0';
          }
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

      // Different swap calculations based on token pair (excluding BNB↔USDT)
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
        // USDT to BAM: Current Presale 2 price $0.000001 = 1M BAM per USDT
        feePercentage = FEES.LOW_FEE;
        const bamPrice = 0.000001; // Presale 2 rate
        outputAmount = (parseFloat(amount) / bamPrice).toString();
      } else if (from.symbol === 'BNB' && to.symbol === 'BAM') {
        // BNB to BAM: Using live BNB price
        feePercentage = FEES.LOW_FEE;
        if (priceInfo) {
          const usdValue = parseFloat(amount) * priceInfo.bnbPrice;
          const bamPrice = 0.000001; // Presale 2 rate
          outputAmount = (usdValue / bamPrice).toString();
        }
      } else if (from.symbol === 'BAM' && to.symbol === 'USDT') {
        // BAM to USDT: 1.5% fee
        feePercentage = FEES.HIGH_FEE;
        const bamPrice = 0.000001; // Presale 2 rate
        const usdtValue = parseFloat(amount) * bamPrice;
        const fee = usdtValue * (feePercentage / 100);
        outputAmount = (usdtValue - fee).toString();
      } else if (from.symbol === 'BAM' && to.symbol === 'BNB') {
        // BAM to BNB: 1.5% fee
        feePercentage = FEES.HIGH_FEE;
        if (priceInfo) {
          const bamPrice = 0.000001; // Presale 2 rate
          const usdValue = parseFloat(amount) * bamPrice;
          const fee = usdValue * (feePercentage / 100);
          const bnbValue = (usdValue - fee) / priceInfo.bnbPrice;
          outputAmount = bnbValue.toString();
        }
      } else if ((from.symbol === 'BNB' && to.symbol === 'USDT') || (from.symbol === 'USDT' && to.symbol === 'BNB')) {
        // BNB↔USDT swaps not supported - show error
        setError('Direct BNB↔USDT swaps are not supported. Please use USDB as an intermediate token.');
        return;
      }

      const fee = parseFloat(amount) * (feePercentage / 100);
      setQuote({
        inputAmount: amount,
        outputAmount: outputAmount,
        fee: fee.toString(),
        feePercentage,
        priceImpact: 0, // No price impact for fixed-price swaps
        minimumReceived: outputAmount, // Same as output for fixed swaps
        route
      });

      setToAmount(outputAmount);
    } catch (error) {
      console.error('Quote calculation failed:', error);
      setError('Failed to calculate quote');
    }
  }, [priceInfo]);

  // Check purchase history
  const checkPurchaseHistory = async (address: string) => {
    try {
      const web3 = new Web3((window as any).ethereum);
      const contract = new web3.eth.Contract(COMPLETE_BAM_SWAP_ABI, BAM_SWAP_ADDRESS);
      
      const purchaseAmount = await contract.methods.walletPurchases(address).call();
      const hasPurchased = purchaseAmount && BigInt(purchaseAmount.toString()) > BigInt(0);
      setHasAlreadyPurchased(Boolean(hasPurchased));
    } catch (error: any) {
      console.error('Error checking purchase history:', error);
      setHasAlreadyPurchased(false);
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    // Button validation logic only - no external notifications
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return; // Button will show "Enter amount"
    }

    if (parseFloat(fromAmount) < 1) {
      return; // Button will show "Minimum: 1 [token]"
    }

    if (hasAlreadyPurchased && ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') || (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM'))) {
      return; // Button will show "Already Purchased"
    }

    if ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') && (parseFloat(fromAmount) < 2 || parseFloat(fromAmount) > 5)) {
      return; // Button will show "BAM requires 2-5 USDT"
    }

    // Execute the swap
    setIsLoading(true);
    setError('');
    setTxStatus('pending');

    try {
      // Implementation continues...
      console.log('Swap execution started:', { fromToken, toToken, fromAmount });
      // Add actual swap logic here
      
      setTxStatus('success');
    } catch (error: any) {
      console.error('Swap failed:', error);
      setError(error.message || 'Transaction failed');
      setTxStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-900">
        {/* Navigation Header */}
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo and Brand */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <img
                    src={bamTokenImg}
                    alt="BAM Token"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-xl font-bold text-white">BAM Swap</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Home
                </Link>
                <a href="#ecosystem" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Ecosystem
                </a>
                <a href="#tokenomics" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Tokenomics
                </a>
                <a href="#projects" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Projects
                </a>
              </div>

              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5 text-white" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 bg-gray-900 border-gray-700">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center space-x-2 p-4 border-b border-gray-700">
                        <img
                          src={bamTokenImg}
                          alt="BAM Token"
                          className="h-6 w-6 rounded-full"
                        />
                        <span className="text-lg font-semibold text-white">BAM Ecosystem</span>
                      </div>
                      
                      <div className="flex-1 overflow-auto py-4">
                        <div className="space-y-2 px-4">
                          <Link href="/">
                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                              <Home className="mr-2 h-4 w-4" />
                              Home
                            </Button>
                          </Link>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                            <Activity className="mr-2 h-4 w-4" />
                            Ecosystem
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Tokenomics
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                            <Zap className="mr-2 h-4 w-4" />
                            Projects
                          </Button>
                        </div>
                      </div>

                      {walletAddress && (
                        <div className="border-t border-gray-700 p-4">
                          <div className="text-sm text-gray-400">Connected:</div>
                          <div className="text-sm text-white font-mono">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </div>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex items-center justify-center p-4 pt-8">
          <div className="w-full max-w-md mx-auto space-y-4">
          
          {/* Swap Card */}
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">BAM Swap</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowLimitsModal(true)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  {!walletAddress ? (
                    <Button
                      onClick={connectWallet}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm px-3 py-2"
                    >
                      <Wallet className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  ) : (
                    <div className="text-xs text-gray-400 max-w-20 truncate">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                  )}
                </div>
              </div>

              {/* From Token */}
              <div className="space-y-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">From</span>
                    <span className="text-xs text-gray-500">
                      Balance: {balances[fromToken.symbol] ? parseFloat(balances[fromToken.symbol]).toFixed(4) : '0.0000'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFromAmount(value);
                        calculateQuote(value, fromToken, toToken);
                      }}
                      className="flex-1 bg-transparent border-none text-xl font-semibold text-white placeholder-gray-500 p-0 h-auto"
                    />
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 bg-gray-600/50 hover:bg-gray-600 px-3 py-2 rounded-lg"
                    >
                      <img src={bamTokenImg} alt="BAM" className="w-5 h-5 rounded-full" />
                      <span className="font-medium text-white">{fromToken.symbol}</span>
                    </Button>
                  </div>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromToken(toToken);
                      setToToken(fromToken);
                      setFromAmount(toAmount);
                      setToAmount(fromAmount);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 rounded-full p-2"
                  >
                    <ArrowDownUp className="w-4 h-4 text-gray-300" />
                  </Button>
                </div>

                {/* To Token */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">To</span>
                    <span className="text-xs text-gray-500">
                      Balance: {balances[toToken.symbol] ? parseFloat(balances[toToken.symbol]).toFixed(4) : '0.0000'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={toAmount}
                      readOnly
                      className="flex-1 bg-transparent border-none text-xl font-semibold text-white placeholder-gray-500 p-0 h-auto"
                    />
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 bg-gray-600/50 hover:bg-gray-600 px-3 py-2 rounded-lg"
                    >
                      <img src={bamTokenImg} alt="BAM" className="w-5 h-5 rounded-full" />
                      <span className="font-medium text-white">{toToken.symbol}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Swap Button - All logic here */}
              {!walletAddress ? (
                <Button
                  onClick={connectWallet}
                  className="w-full mt-6 h-12 text-base font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Connect Wallet
                </Button>
              ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
                <Button
                  disabled
                  className="w-full mt-6 h-12 text-base font-bold bg-gray-700 text-gray-400 cursor-not-allowed"
                >
                  Enter an amount
                </Button>
              ) : parseFloat(fromAmount) < 1 ? (
                <Button
                  disabled
                  className="w-full mt-6 h-12 text-base font-bold bg-red-700 text-red-200 cursor-not-allowed"
                >
                  ❌ Minimum: 1 {fromToken.symbol}
                </Button>
              ) : hasAlreadyPurchased && ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') || (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM')) ? (
                <Button
                  disabled
                  className="w-full mt-6 h-12 text-base font-bold bg-red-600 text-red-200 cursor-not-allowed"
                >
                  🚫 Already Purchased - One Per Wallet
                </Button>
              ) : ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') && 
                    (parseFloat(fromAmount) < 2 || parseFloat(fromAmount) > 5)) ? (
                <Button
                  disabled
                  className="w-full mt-6 h-12 text-base font-bold bg-orange-700 text-orange-200 cursor-not-allowed"
                >
                  ⚠️ BAM requires 2-5 USDT
                </Button>
              ) : (
                <Button
                  onClick={handleSwap}
                  disabled={isLoading}
                  className="w-full mt-6 h-12 text-base font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isLoading ? 'Processing...' : `Swap ${fromToken.symbol} for ${toToken.symbol}`}
                </Button>
              )}

              {/* Transaction Status */}
              {txStatus !== 'idle' && (
                <div className="mt-4">
                  {txStatus === 'pending' && (
                    <Alert className="border-yellow-500 bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-300">
                        Processing transaction...
                      </AlertDescription>
                    </Alert>
                  )}
                  {txStatus === 'success' && (
                    <Alert className="border-green-500 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-300">
                        Swap successful!
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

            </CardContent>
          </Card>

        </div>
      </div>

      {/* Limits Modal */}
      <Dialog open={showLimitsModal} onOpenChange={setShowLimitsModal}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-yellow-400" />
              <span>BAM Purchase Limits</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Purchase Requirements</h3>
              <div className="space-y-2 text-sm text-yellow-200">
                <div>• Purchase Range: 2-5 USDT (or equivalent BNB)</div>
                <div>• One-time purchase per wallet only</div>
                <div>• BAM Reward: 1,000,000 BAM per USDT</div>
                <div>• Cannot repeat purchases with same wallet</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}