import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Settings, RefreshCw, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Activity, Info, Zap, BarChart3, Search, Star, Clock } from 'lucide-react';
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
import { Home, ArrowLeft, Menu, X, Wallet, Copy, LogOut, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

const SwapPage = () => {
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

  // Chainlink-first price fetching with backend API
  const fetchReliablePrice = async (): Promise<{ price: number; source: string }> => {
    const dataSources = [
      // Primary: Chainlink via our backend (most reliable and decentralized)
      {
        name: 'Chainlink Oracle',
        fetch: async () => {
          const response = await fetch('/api/prices/bnb');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          return { price: data.price, source: data.source };
        }
      },
      // Backup: External APIs via CORS proxy
      {
        name: 'CoinGecko API',
        fetch: async () => {
          const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'));
          const data = await response.json();
          const price = data?.binancecoin?.usd || 0;
          return { price, source: 'CoinGecko API' };
        }
      },
      // Additional backup
      {
        name: 'Binance API',
        fetch: async () => {
          const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT'));
          const data = await response.json();
          const price = parseFloat(data?.price || '0');
          return { price, source: 'Binance API' };
        }
      }
    ];

    for (const source of dataSources) {
      try {
        const result = await source.fetch();
        if (result.price > 100 && result.price < 2000) { // Reasonable BNB price range
          return { price: result.price, source: result.source };
        }
      } catch (error) {
        console.error(`${source.name} failed:`, error);
        continue;
      }
    }
    
    // Final fallback
    return { price: 725, source: 'Static Fallback' };
  };



  // Enterprise price update system with Chainlink integration
  useEffect(() => {
    const updatePrices = async () => {
      try {
        setError(''); // Clear previous errors
        const { price: bnbPrice, source: priceSource } = await fetchReliablePrice();
        
        setPriceInfo({
          bnbPrice,
          bamPrice: 0.0000001, // Fixed BAM price from contract
          isValidPrice: priceSource !== 'Static Fallback',
          lastUpdated: Date.now()
        });
        
        // Silent price update - no console logging
      } catch (err) {
        console.error('Price update failed:', err);
        // Preserve last known good price or use fallback
        setPriceInfo(prev => prev || {
          bnbPrice: 725,
          bamPrice: 0.0000001,
          isValidPrice: false,
          lastUpdated: Date.now()
        });
      }
    };

    // Initial price fetch
    updatePrices();
    
    // Update every 30 seconds (Chainlink updates every ~30 seconds on BSC)
    const interval = setInterval(updatePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get contract information with fallback data
  const getContractInfo = async () => {
    try {
      const data = ContractEncoder.encodeFunctionCall('getContractInfo()');
      const result = await web3Utils.callContract(BAM_SWAP_ADDRESS, data);
      return ContractEncoder.decodeResult(result, 'tuple');
    } catch (error) {
      console.error('Failed to get contract info:', error);
      // Return fallback data for testing
      return [
        '1000000000000000000000', // USDT balance
        '1000000000000000000000', // USDB balance  
        '100000000000000000000000000', // BAM balance
        '1000000000000000000', // BNB balance
        '600000000000000000000', // BNB price ($600)
        '100', // BAM price (0.0000001)
        true, // price valid
        false, // using fallback
        false, // emergency mode
        false // paused
      ];
    }
  };

  // Connect Wallet with minimal logging
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const address = await web3Utils.connectWallet();
      setWalletAddress(address);
      await updateBalances(address);
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setWalletAddress('');
      setBalances({});
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing wallet connection on page load
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const provider = await web3Utils.getProvider();
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await updateBalances(accounts[0]);
          }
        }
      } catch (error) {
        // Silent fail - no wallet connection
      }
    };

    checkWalletConnection();
  }, []);

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setBalances({});
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
      } catch (error) {
        // Silent fail
      }
    }
  };

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format numbers for clean display like Uniswap
  const formatDisplayAmount = (amount: string, symbol: string): string => {
    const num = parseFloat(amount || '0');
    if (num === 0) return '0';
    
    // BAM tokens need special handling due to high decimal count
    if (symbol === 'BAM') {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`;
      } else if (num >= 1) {
        return num.toFixed(2);
      } else {
        return num.toExponential(2);
      }
    }
    
    // Standard formatting for other tokens
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else if (num >= 1) {
      return num.toFixed(4);
    } else if (num >= 0.0001) {
      return num.toFixed(6);
    } else {
      return num.toExponential(2);
    }
  };

  // Helper function to get token price in USD
  const getTokenUSDPrice = (tokenSymbol: string): number => {
    if (priceInfo?.isValidPrice) {
      switch (tokenSymbol) {
        case 'BNB':
          return priceInfo.bnbPrice;
        case 'BAM':
          return priceInfo.bamPrice;
        case 'USDT':
        case 'USDB':
          return 1; // Stablecoins
        default:
          return 0;
      }
    }
    
    // Fallback prices when contract data unavailable
    switch (tokenSymbol) {
      case 'BNB':
        return priceInfo?.bnbPrice || 692; // Use fetched price or fallback
      case 'BAM':
        return 0.0000001; // BAM price from contract
      case 'USDT':
      case 'USDB':
        return 1; // Stablecoins
      default:
        return 0;
    }
  };

  // Helper function to calculate USD value
  const calculateUSDValue = (amount: string, tokenSymbol: string): string => {
    const numAmount = parseFloat(amount || '0');
    const price = getTokenUSDPrice(tokenSymbol);
    const usdValue = numAmount * price;
    
    if (usdValue === 0) return '$0.00';
    if (usdValue < 0.01) return '< $0.01';
    
    return `$${usdValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Update token balances with minimal logging
  const updateBalances = async (address: string) => {
    if (!address) return;

    const newBalances: Record<string, string> = {};
    
    try {
      // Get BNB balance
      const bnbBalance = await web3Utils.getBalance(address);
      newBalances.BNB = bnbBalance;

      // Get token balances for each ERC20 token
      for (const [symbol, token] of Object.entries(TOKENS)) {
        if (symbol !== 'BNB' && token.address) {
          try {
            const balance = await web3Utils.getBalance(address, token.address);
            newBalances[symbol] = balance;
          } catch (tokenError) {
            newBalances[symbol] = '0';
          }
        }
      }

      setBalances(newBalances);
    } catch (error) {
      // Set default balances to prevent UI issues
      setBalances({
        BNB: '0',
        USDT: '0', 
        USDB: '0',
        BAM: '0'
      });
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
        const data = web3Utils.encodeFunctionCall('swapUSDTToUSDB(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'USDB' && toToken.symbol === 'USDT') {
        await approveToken(TOKEN_ADDRESSES.USDB, amountWei);
        const data = web3Utils.encodeFunctionCall('swapUSDBToUSDT(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') {
        await approveToken(TOKEN_ADDRESSES.USDT, amountWei);
        const data = web3Utils.encodeFunctionCall('buyBAMWithUSDT(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM') {
        const data = web3Utils.encodeFunctionCall('buyBAMWithBNB()');
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          value: amountWei,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'BAM' && toToken.symbol === 'USDT') {
        await approveToken(TOKEN_ADDRESSES.BAM, amountWei);
        const data = web3Utils.encodeFunctionCall('sellBAMForUSDT(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          from: walletAddress
        });
      } else if (fromToken.symbol === 'BAM' && toToken.symbol === 'BNB') {
        await approveToken(TOKEN_ADDRESSES.BAM, amountWei);
        const data = web3Utils.encodeFunctionCall('sellBAMForBNB(uint256)', [amountWei]);
        txHash = await web3Utils.sendTransaction({
          to: BAM_SWAP_ADDRESS,
          data,
          value: '0',
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
    const data = web3Utils.encodeFunctionCall('approve(address,uint256)', [BAM_SWAP_ADDRESS, amount]);
    await web3Utils.sendTransaction({
      to: tokenAddress,
      data,
      from: walletAddress
    });
  };

  // Enhanced Token Selector with filtering and search like Uniswap
  const TokenSelector = ({ token, onSelect, label }: { token: TokenInfo; onSelect: (token: TokenInfo) => void; label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const availableTokens = Object.values(TOKENS);

    // Filter tokens based on swap rules (exclude BNB↔USDT)
    const getFilteredTokens = () => {
      return availableTokens.filter(tokenOption => {
        // Exclude BNB↔USDT swaps
        if (label === 'from' && token.symbol === 'BNB' && tokenOption.symbol === 'USDT') return false;
        if (label === 'from' && token.symbol === 'USDT' && tokenOption.symbol === 'BNB') return false;
        if (label === 'to') {
          const otherToken = label === 'from' ? toToken : fromToken;
          if (otherToken.symbol === 'BNB' && tokenOption.symbol === 'USDT') return false;
          if (otherToken.symbol === 'USDT' && tokenOption.symbol === 'BNB') return false;
        }
        
        // Search filter
        if (searchQuery) {
          return tokenOption.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 tokenOption.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      });
    };

    const filteredTokens = getFilteredTokens();

    // Common token pairs (popular tokens)
    const commonTokens = ['USDT', 'USDB', 'BAM', 'BNB'];
    const popularTokens = filteredTokens.filter(t => commonTokens.includes(t.symbol));
    const otherTokens = filteredTokens.filter(t => !commonTokens.includes(t.symbol));

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="p-1.5 sm:p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-700/50">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="text-base sm:text-lg">{token.icon}</div>
              <span className="font-semibold text-white text-sm sm:text-base">{token.symbol}</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <span>Select a token</span>
            </DialogTitle>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search name or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Popular Tokens Section */}
          {!searchQuery && (
            <div className="space-y-3">
              <div className="text-sm text-gray-400 font-medium">Popular tokens</div>
              <div className="grid grid-cols-4 gap-2">
                {popularTokens.slice(0, 4).map((tokenOption) => (
                  <Button
                    key={tokenOption.symbol}
                    variant="ghost"
                    className="flex flex-col items-center p-3 h-auto bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700"
                    onClick={() => {
                      onSelect(tokenOption);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="text-xl mb-1">{tokenOption.icon}</div>
                    <span className="text-xs font-medium text-white">{tokenOption.symbol}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Token List */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {!searchQuery && <div className="text-sm text-gray-400 font-medium mb-3">Your tokens</div>}
            
            {filteredTokens.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">No tokens found</div>
                <div className="text-gray-500 text-xs mt-1">Try a different search term</div>
              </div>
            ) : (
              filteredTokens.map((tokenOption) => {
                const isInvalidPair = 
                  (label === 'to' && fromToken.symbol === 'BNB' && tokenOption.symbol === 'USDT') ||
                  (label === 'to' && fromToken.symbol === 'USDT' && tokenOption.symbol === 'BNB') ||
                  (label === 'from' && toToken.symbol === 'BNB' && tokenOption.symbol === 'USDT') ||
                  (label === 'from' && toToken.symbol === 'USDT' && tokenOption.symbol === 'BNB');

                return (
                  <Button
                    key={tokenOption.symbol}
                    variant="ghost"
                    disabled={isInvalidPair}
                    className={`w-full justify-start p-4 h-auto hover:bg-gray-800 ${
                      isInvalidPair ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isInvalidPair) {
                        onSelect(tokenOption);
                        setIsOpen(false);
                        setSearchQuery('');
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="text-2xl">{tokenOption.icon}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{tokenOption.symbol}</span>
                          {tokenOption.symbol === 'BAM' && (
                            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                              $0.0000001
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{tokenOption.name}</div>
                        {isInvalidPair && (
                          <div className="text-xs text-red-400 mt-1">
                            Direct BNB↔USDT swaps not supported
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {balances[tokenOption.symbol] !== undefined ? (
                          <>
                            <div className="text-sm font-medium text-white">
                              {parseFloat(balances[tokenOption.symbol] || '0') > 0 ? 
                                formatDisplayAmount(balances[tokenOption.symbol], tokenOption.symbol) : 
                                '0'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {parseFloat(balances[tokenOption.symbol] || '0') > 0 ? (
                                tokenOption.symbol === 'BAM' ? 
                                  `$${(parseFloat(balances[tokenOption.symbol]) * 0.0000001).toFixed(6)}` :
                                  tokenOption.symbol === 'USDT' || tokenOption.symbol === 'USDB' ?
                                  `$${balances[tokenOption.symbol]}` :
                                  `~$${(parseFloat(balances[tokenOption.symbol]) * (priceInfo?.bnbPrice || 600)).toFixed(2)}`
                              ) : (
                                '$0.00'
                              )}
                            </div>
                          </>
                        ) : walletAddress ? (
                          <div className="text-xs text-gray-500">
                            Loading...
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Connect wallet
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>

          {/* Manage Token Lists */}
          <div className="border-t border-gray-700 pt-3">
            <Button
              variant="ghost"
              className="w-full justify-center text-gray-400 hover:text-white text-sm"
              onClick={() => {
                // Could open token list management
                console.log('Manage token lists');
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage token lists
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Navigation Header */}
        <nav className="fixed top-0 w-full z-50 glass-card backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Back to Home */}
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
              </a>
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/bamToken_1752877645023.png" 
                  alt="BAM Token" 
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <span className="text-xl font-bold gradient-text">BAM Swap</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="/#home" className="text-gray-300 hover:text-primary transition-colors">Home</a>
              <a href="/#ecosystem" className="text-gray-300 hover:text-primary transition-colors">Ecosystem</a>
              <a href="/#tokenomics" className="text-gray-300 hover:text-primary transition-colors">Tokenomics</a>
              <a href="/#projects" className="text-gray-300 hover:text-primary transition-colors">Projects</a>
              <div className="w-px h-6 bg-gray-600"></div>
              <span className="text-primary font-medium">Swap</span>
              
              {/* Wallet Connection Status */}
              {walletAddress ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">Connected</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-gray-800 border-gray-700">
                    <div className="px-3 py-2 border-b border-gray-700">
                      <div className="text-sm font-medium text-yellow-400 mb-1">WALLET INFO</div>
                      <div className="text-xs text-gray-300 mb-2">Address:</div>
                      <div className="text-sm text-white font-mono">{formatAddress(walletAddress)}</div>
                      {balances.BNB && (
                        <div className="text-xs text-gray-400 mt-1">
                          Balance: {formatDisplayAmount(balances.BNB, 'BNB')} BNB
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem onClick={copyAddress} className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={disconnectWallet} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={connectWallet}
                  disabled={isLoading}
                  variant="outline" 
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6 text-gray-300" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="glass-card border-border">
                  <div className="flex flex-col space-y-4 mt-8">
                    <a href="/" className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors">
                      <Home className="w-4 h-4" />
                      Home
                    </a>
                    <a href="/#ecosystem" className="text-gray-300 hover:text-primary transition-colors">Ecosystem</a>
                    <a href="/#tokenomics" className="text-gray-300 hover:text-primary transition-colors">Tokenomics</a>
                    <a href="/#projects" className="text-gray-300 hover:text-primary transition-colors">Projects</a>
                    <div className="border-t border-gray-600 pt-4">
                      <span className="text-primary font-medium">Current: Swap</span>
                    </div>
                    
                    {/* Mobile Wallet Info */}
                    <div className="border-t border-gray-600 pt-4">
                      {walletAddress ? (
                        <div className="space-y-3">
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm font-medium text-green-400">Connected</span>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">Address:</div>
                            <div className="text-sm text-white font-mono">{formatAddress(walletAddress)}</div>
                            {balances.BNB && (
                              <div className="text-xs text-gray-400 mt-1">
                                Balance: {formatDisplayAmount(balances.BNB, 'BNB')} BNB
                              </div>
                            )}
                          </div>
                          <Button onClick={copyAddress} variant="outline" className="w-full text-gray-300 border-gray-600">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Address
                          </Button>
                          <Button onClick={disconnectWallet} variant="outline" className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10">
                            <LogOut className="w-4 h-4 mr-2" />
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={connectWallet}
                          disabled={isLoading}
                          variant="outline" 
                          className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-2 sm:p-3 pt-18 sm:pt-20">
        <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400 mb-2">Pioneering Community Growth and Wealth</p>
          {priceInfo && (
            <div className="flex justify-center items-center space-x-2 mb-2 text-xs">
              <Badge variant="outline" className="text-green-400 border-green-400 px-1.5 py-0.5">
                <TrendingUp className="w-2 h-2 mr-0.5" />
                BNB ${priceInfo.bnbPrice.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400 px-1.5 py-0.5">
                <Activity className="w-2 h-2 mr-0.5" />
                BAM $0.0000001
              </Badge>
            </div>
          )}
        </div>

        {/* Main Swap Card */}
        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-2 sm:p-3">
            {/* Header with Trade Types */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-1">
                <Button variant="default" className="bg-gray-800 text-white border-yellow-500 text-xs px-2 py-1 h-7">
                  Swap
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-400 text-xs px-2 py-1 h-7">
                  Limit
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-400 text-xs px-2 py-1 h-7 hidden sm:block">
                  Buy
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-400 text-xs px-2 py-1 h-7 hidden sm:block">
                  Sell
                </Button>
              </div>
              <div className="flex items-center space-x-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => priceInfo && calculateQuote(fromAmount, fromToken, toToken)}
                        className="text-gray-400 hover:text-white p-1 h-6 w-6"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh Price</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1 h-6 w-6">
                        <Info className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-600 text-white max-w-xs">
                      <div className="space-y-1 text-xs">
                        <div>Fixed fees: 0.5% (USDT→USDB/BAM, BNB→BAM)</div>
                        <div>Higher fees: 1.5% (USDB→USDT, BAM→USDT/BNB)</div>
                        <div>Minimum: 1 USDT per transaction</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-300">From</label>
                {balances[fromToken.symbol] && (
                  <button
                    onClick={() => setFromAmount(balances[fromToken.symbol])}
                    className="text-xs text-yellow-400 hover:text-yellow-300"
                  >
                    Max: {formatDisplayAmount(balances[fromToken.symbol], fromToken.symbol)}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0"
                  className="text-xl sm:text-2xl font-bold bg-transparent border-none text-white h-12 sm:h-14 pr-24 sm:pr-28 focus:ring-0 focus:border-none"
                  step="any"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <TokenSelector token={fromToken} onSelect={setFromToken} label="from" />
                </div>
              </div>
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <div className="text-xs text-gray-400 px-1">
                  {calculateUSDValue(fromAmount, fromToken.symbol)}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-2">
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
            <div className="space-y-1 mb-4">
              <label className="text-xs font-medium text-gray-300">To</label>
              <div className="relative">
                <Input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0"
                  className="text-xl sm:text-2xl font-bold bg-transparent border-none text-white h-12 sm:h-14 pr-24 sm:pr-28 focus:ring-0 focus:border-none"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <TokenSelector token={toToken} onSelect={setToToken} label="to" />
                </div>
              </div>
              {toAmount && parseFloat(toAmount) > 0 && (
                <div className="text-xs text-gray-400 px-1">
                  {calculateUSDValue(toAmount, toToken.symbol)}
                </div>
              )}
            </div>

            {/* Enhanced Quote Information */}
            {quote && (
              <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg p-2 mb-3 border border-gray-600/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300 font-medium">Trade Details</span>
                  <Info className="w-3 h-3 text-gray-400" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 flex items-center">
                      <Zap className="w-2 h-2 mr-1" />
                      Network Fee ({quote.feePercentage}%)
                    </span>
                    <span className="text-xs text-white font-medium">{formatDisplayAmount(quote.fee, fromToken.symbol)} {fromToken.symbol}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">You Receive</span>
                    <span className="text-xs text-white font-medium">{formatDisplayAmount(quote.outputAmount, toToken.symbol)} {toToken.symbol}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 flex items-center">
                      <BarChart3 className="w-2 h-2 mr-1" />
                      Price Impact
                    </span>
                    <span className="text-xs text-green-400 font-medium">~0%</span>
                  </div>
                  
                  <div className="border-t border-gray-600/50 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Route</span>
                      <div className="flex items-center space-x-1">
                        {quote.route.map((token, index) => [
                          <span key={`token-${index}`} className="text-white text-xs">{token}</span>,
                          index < quote.route.length - 1 && (
                            <ArrowUpDown key={`arrow-${index}`} className="w-2 h-2 text-gray-500 rotate-90" />
                          )
                        ]).flat().filter(Boolean)}
                      </div>
                    </div>
                  </div>
                  
                  {fromToken.symbol === 'USDT' && toToken.symbol === 'BAM' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-1.5 mt-1">
                      <div className="text-yellow-400 text-xs font-medium">Fixed Price Swap</div>
                      <div className="text-yellow-300 text-xs">
                        1 USDT = 10,000,000 BAM (Rate: $0.0000001)
                      </div>
                    </div>
                  )}
                  
                  {(fromToken.symbol === 'BAM' && (toToken.symbol === 'USDT' || toToken.symbol === 'BNB')) && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1.5 mt-1">
                      <div className="text-blue-400 text-xs font-medium">BAM Sale</div>
                      <div className="text-blue-300 text-xs">
                        Higher fees apply (1.5%) for selling BAM tokens
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Connect/Swap Button */}
            {!walletAddress ? (
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            ) : !quote || !fromAmount || parseFloat(fromAmount) <= 0 ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Enter an amount
              </Button>
            ) : parseFloat(fromAmount) < 1 ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Minimum: 1 {fromToken.symbol}
              </Button>
            ) : balances[fromToken.symbol] && parseFloat(fromAmount) > parseFloat(balances[fromToken.symbol]) ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-red-700 text-red-200 rounded-lg cursor-not-allowed"
              >
                Insufficient {fromToken.symbol} balance
              </Button>
            ) : (
              <Button
                onClick={executeSwap}
                disabled={isLoading}
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span>Review Swap</span>
                    <div className="text-xs opacity-80 mt-0.5">
                      {formatDisplayAmount(fromAmount, fromToken.symbol)} {fromToken.symbol} → {formatDisplayAmount(toAmount, toToken.symbol)} {toToken.symbol}
                    </div>
                  </div>
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
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-400 space-y-1">
          <p>🔒 Powered by BAM Smart Contracts on BSC</p>
          <p>💎 Professional-grade DeFi with minimal fees</p>
        </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default SwapPage;