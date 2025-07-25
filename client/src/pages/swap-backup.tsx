import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Settings, RefreshCw, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Activity, Info, Zap, BarChart3, Search, Star, Clock, AlertTriangle, Trophy, Users, Heart, Coins } from 'lucide-react';
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
import Web3 from 'web3';
import { COMPLETE_BAM_SWAP_ABI } from '@/lib/complete-bam-swap-abi';
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
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [hasAlreadyPurchased, setHasAlreadyPurchased] = useState<boolean>(false);
  const [showPurchasedWarning, setShowPurchasedWarning] = useState<boolean>(false);
  const [showPurchaseGuide, setShowPurchaseGuide] = useState<boolean>(false);
  const [isCheckingPurchaseHistory, setIsCheckingPurchaseHistory] = useState<boolean>(false);
  const [showAddTokenNotification, setShowAddTokenNotification] = useState<boolean>(false);
  const [contractBalances, setContractBalances] = useState<{[key: string]: string}>({});
  const [showBalanceWarning, setShowBalanceWarning] = useState<boolean>(false);
  const [showMilestoneNotification, setShowMilestoneNotification] = useState<boolean>(false);
  const [milestoneMessage, setMilestoneMessage] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [showPageLoader, setShowPageLoader] = useState<boolean>(true);

  // Token balances
  const [balances, setBalances] = useState<Record<string, string>>({});

  // Enhanced validation states for better UX
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidAmount, setIsValidAmount] = useState(false);
  const [contractStatus, setContractStatus] = useState<{
    isPaused: boolean;
    functionPaused: { [key: string]: boolean };
    lastChecked: number;
  } | null>(null);
  
  // Real-time contract data
  const [contractData, setContractData] = useState<{
    bamPrice: string;
    minPurchase: string;
    maxPurchase: string;
    bamPerUSDT: string;
    lastUpdated: number;
  } | null>(null);

  // Fetch real-time contract data
  const fetchContractData = async () => {
    try {
      if (!(window as any).web3 || !walletAddress) return;
      
      const contract = new (window as any).web3.eth.Contract(
        COMPLETE_BAM_SWAP_ABI,
        BAM_SWAP_ADDRESS
      );

      // Fetch current contract parameters
      const [bamPriceInUSD, minPurchaseLimit, maxPurchaseLimit] = await Promise.all([
        contract.methods.bamPriceInUSD().call(),
        contract.methods.minPurchaseLimit().call(),
        contract.methods.maxPurchaseLimit().call()
      ]);

      // Convert bamPriceInUSD to actual price (contract stores as integer, divide by 1e11 for current price)
      const bamPrice = (Number(bamPriceInUSD) / 1e11).toFixed(9); 
      const minPurchase = (window as any).web3.utils.fromWei(minPurchaseLimit.toString(), 'ether');
      const maxPurchase = (window as any).web3.utils.fromWei(maxPurchaseLimit.toString(), 'ether');
      
      // Calculate BAM tokens per USDT (based on contract's bamPriceInUSD value)
      const bamPerUSDT = Number(bamPriceInUSD).toLocaleString();

      setContractData({
        bamPrice,
        minPurchase,
        maxPurchase,
        bamPerUSDT,
        lastUpdated: Date.now()
      });

    } catch (error) {
      console.error('Failed to fetch contract data:', error);
    }
  };

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
          bamPrice: 0.000001, // Current Presale 2 BAM price
          isValidPrice: priceSource !== 'Static Fallback',
          lastUpdated: Date.now()
        });
        
        // Silent price update - no console logging
      } catch (err) {
        console.error('Price update failed:', err);
        // Preserve last known good price or use fallback
        setPriceInfo(prev => prev || {
          bnbPrice: 725,
          bamPrice: 0.000001, // Current Presale 2 BAM price
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

  // Fetch contract data when wallet connects
  useEffect(() => {
    if (walletAddress && (window as any).web3) {
      fetchContractData();
      // Refresh every 2 minutes
      const interval = setInterval(fetchContractData, 120000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  // Check contract pause status for specific functions
  const checkContractStatus = async () => {
    if (!walletAddress) return;

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;

      // Check main contract pause
      const pausedResult = await ethereum.request({
        method: 'eth_call',
        params: [{
          to: BAM_SWAP_ADDRESS,
          data: '0x5c975abb' // paused() function selector
        }, 'latest']
      });
      
      // Check individual function pause states
      const functions = {
        usdtToUsdb: '0x9fc8f73a', // swapUSDTToUSDBPaused()
        usdbToUsdt: '0x1234abcd', // swapUSDBToUSDTPaused() (placeholder)
        usdtToBam: '0x5678cdef', // buyBAMWithUSDTPaused() (placeholder)
        bnbToBam: '0x9abc1234', // buyBAMWithBNBPaused() (placeholder)
        bamToUsdt: '0x4567890a', // sellBAMForUSDTPaused() (placeholder)
        bamToBnb: '0xbcdef123' // sellBAMForBNBPaused() (placeholder)
      };

      const functionPaused: { [key: string]: boolean } = {};
      
      for (const [funcName, selector] of Object.entries(functions)) {
        try {
          const result = await ethereum.request({
            method: 'eth_call',
            params: [{
              to: BAM_SWAP_ADDRESS,
              data: selector
            }, 'latest']
          });
          functionPaused[funcName] = parseInt(result, 16) === 1;
        } catch (error) {
          // If function doesn't exist, assume it's not paused
          functionPaused[funcName] = false;
        }
      }

      setContractStatus({
        isPaused: parseInt(pausedResult, 16) === 1,
        functionPaused,
        lastChecked: Date.now()
      });
    } catch (error) {
      console.error('Failed to check contract status:', error);
    }
  };

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

  // Check if wallet has already purchased BAM
  const checkPurchaseHistory = useCallback(async (address: string) => {
    if (!(window as any).ethereum || !address) {
      setHasAlreadyPurchased(false);
      return;
    }

    try {
      setIsCheckingPurchaseHistory(true);
      console.log(`🔍 Checking purchase history for wallet: ${address}`);
      
      const web3 = new Web3((window as any).ethereum);
      const contract = new web3.eth.Contract(COMPLETE_BAM_SWAP_ABI, BAM_SWAP_ADDRESS);
      
      // Check if wallet has purchased BAM by calling walletPurchases mapping
      console.log(`📞 Calling contract.methods.walletPurchases(${address}).call()`);
      const purchaseAmount = await contract.methods.walletPurchases(address).call();
      console.log(`✅ Contract response - Purchase amount:`, purchaseAmount);
      
      // If purchase amount > 0, wallet has already purchased
      const hasPurchased = purchaseAmount && BigInt(purchaseAmount.toString()) > BigInt(0);
      setHasAlreadyPurchased(Boolean(hasPurchased));
      
      // Auto-dismiss purchase warning after 5 seconds
      if (hasPurchased) {
        setShowPurchasedWarning(true);
        setTimeout(() => setShowPurchasedWarning(false), 5000);
      } else {
        // Show brief purchase guide for new users
        setShowPurchaseGuide(true);
        setTimeout(() => setShowPurchaseGuide(false), 3000);
      }
      
      console.log(`🔍 Purchase history result for ${address}:`, hasPurchased ? '🚫 Already purchased' : '✅ No previous purchase');
    } catch (error: any) {
      console.error('❌ Error checking purchase history:', error);
      console.log('📋 Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No code',
        data: error?.data || 'No data'
      });
      // Default to allowing purchase if check fails
      setHasAlreadyPurchased(false);
    } finally {
      setIsCheckingPurchaseHistory(false);
    }
  }, []);

  // Connect Wallet with purchase history check
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const address = await web3Utils.connectWallet();
      setWalletAddress(address);
      await updateBalances(address);
      await checkPurchaseHistory(address);
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setWalletAddress('');
      setBalances({});
      setHasAlreadyPurchased(false);
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
            await checkPurchaseHistory(accounts[0]);
          }
        }
      } catch (error) {
        // Silent fail - no wallet connection
      }
    };

    checkWalletConnection();
    
    // Check contract balances on page load
    checkContractBalances();
    
    // Hide page loader after 3 seconds (with delay)
    setTimeout(() => setShowPageLoader(false), 3000);
    
    // Check contract balances every 30 seconds
    const balanceInterval = setInterval(checkContractBalances, 30000);
    return () => clearInterval(balanceInterval);
  }, []);

  // Check contract status when wallet connects and periodically
  useEffect(() => {
    if (walletAddress) {
      checkContractStatus();
      
      // Check every 2 minutes for pause status updates
      const interval = setInterval(checkContractStatus, 120000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setBalances({});
    setHasAlreadyPurchased(false);
  };

  // Add BAM token to wallet
  const addBAMTokenToWallet = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const result = await web3Utils.addTokenToWallet(
        TOKEN_ADDRESSES.BAM,
        'BAM',
        18,
        `${window.location.origin}/assets/bamToken_1752877645023.png`
      );
      
      if (result) {
        setError('');
        setShowAddTokenNotification(true);
        setTimeout(() => setShowAddTokenNotification(false), 3000);
        console.log('BAM token added to wallet successfully');
      }
    } catch (error: any) {
      console.error('Failed to add BAM token:', error);
      setError(error.message || 'Failed to add BAM token to wallet');
    } finally {
      setIsLoading(false);
    }
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

  // Calculate exact BNB amount needed for 1 USDT equivalent
  const calculateBNBForBAM = () => {
    if (priceInfo && priceInfo.bnbPrice > 0) {
      return (1 / priceInfo.bnbPrice).toFixed(6); // 1 USDT worth of BNB
    }
    return '';
  };

  // Auto-populate exact amounts for BAM purchases
  const autoPopulateBamAmount = () => {
    if (toToken.symbol === 'BAM') {
      if (fromToken.symbol === 'USDT' || fromToken.symbol === 'USDB') {
        if (fromAmount !== '1') {
          setFromAmount('1');
        }
      } else if (fromToken.symbol === 'BNB') {
        const exactBnbAmount = calculateBNBForBAM();
        if (exactBnbAmount && fromAmount !== exactBnbAmount) {
          setFromAmount(exactBnbAmount);
        }
      }
    }
  };

  // Auto-populate when token pair changes
  useEffect(() => {
    autoPopulateBamAmount();
  }, [fromToken.symbol, toToken.symbol, priceInfo?.bnbPrice]);

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

  // Check contract balances
  const checkContractBalances = async () => {
    try {
      const newContractBalances: Record<string, string> = {};
      
      // Get BNB balance of contract
      const bnbBalance = await web3Utils.getBalance(BAM_SWAP_ADDRESS);
      newContractBalances.BNB = bnbBalance;

      // Get token balances for each ERC20 token in contract
      for (const [symbol, token] of Object.entries(TOKENS)) {
        if (symbol !== 'BNB' && token.address) {
          try {
            const balance = await web3Utils.getBalance(BAM_SWAP_ADDRESS, token.address);
            newContractBalances[symbol] = balance;
          } catch (error) {
            console.error(`Failed to get ${symbol} contract balance:`, error);
            newContractBalances[symbol] = '0';
          }
        }
      }
      
      setContractBalances(newContractBalances);
      
      // Check for low BAM balance
      const bamBalance = parseFloat(newContractBalances.BAM || '0');
      if (bamBalance < 50000000 && bamBalance > 0) { // Less than 50M BAM tokens left (5 purchases)
        setShowBalanceWarning(true);
        setTimeout(() => setShowBalanceWarning(false), 10000);
      }
      
      // Check BAM holder milestones
      await checkBAMHolderMilestones(newContractBalances);
      
      return newContractBalances;
    } catch (error) {
      console.error('Failed to check contract balances:', error);
      return {};
    }
  };

  // Check BAM holder count and milestones
  const checkBAMHolderMilestones = async (balances: Record<string, string>) => {
    try {
      const bamBalance = parseFloat(balances.BAM || '0');
      const totalSupply = 1000000000; // 1B BAM initially in contract
      const distributed = totalSupply - bamBalance;
      const estimatedHolders = Math.max(0, Math.floor(distributed / 1000000)); // 1M BAM per holder (Presale 2 rate)

      // Check for milestone (every 100 holders)
      const currentMilestone = Math.floor(estimatedHolders / 100) * 100;
      
      if (currentMilestone >= 100 && estimatedHolders % 100 < 5) { // Show for first 5 holders past milestone
        if (bamBalance <= 0) {
          setMilestoneMessage(`🎉 Presale 2 Complete! Get ready for Presale 3 → Final Uniswap & PancakeSwap launch!`);
        } else {
          setMilestoneMessage(`🎉 Milestone: ${currentMilestone}+ BAM Holders! Presale 2 active - secure before Presale 3 & DEX launch!`);
        }
        setShowMilestoneNotification(true);
        setTimeout(() => setShowMilestoneNotification(false), 8000);
      }

      return estimatedHolders;
    } catch (error) {
      console.error('Failed to check BAM holders:', error);
      return 0;
    }
  };

  // Check if contract has sufficient balance before swap
  const checkSufficientContractBalance = (fromSymbol: string, toSymbol: string, amount: string): boolean => {
    const requiredAmount = parseFloat(amount || '0');
    
    if (toSymbol === 'BAM') {
      // For BAM purchases, need 1M BAM per 1 USDT (Presale 2 rate)
      const requiredBAM = requiredAmount * 1000000;
      const availableBAM = parseFloat(contractBalances.BAM || '0');
      return availableBAM >= requiredBAM;
    } else if (toSymbol === 'USDT') {
      const availableUSDT = parseFloat(contractBalances.USDT || '0');
      return availableUSDT >= requiredAmount;
    } else if (toSymbol === 'USDB') {
      const availableUSDB = parseFloat(contractBalances.USDB || '0');
      return availableUSDB >= requiredAmount;
    }
    
    return true; // Default to true for other swaps
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

    // Check contract balance first
    if (!checkSufficientContractBalance(fromToken.symbol, toToken.symbol, fromAmount)) {
      if (toToken.symbol === 'BAM') {
        setError('Presale 2 Sold Out! Get ready for Presale 3 announcement → Final Uniswap & PancakeSwap launch!');
        setMilestoneMessage('🎉 Presale 2 Complete! Prepare for Presale 3 → Final DEX launch on Uniswap & PancakeSwap!');
        setShowMilestoneNotification(true);
        setTimeout(() => setShowMilestoneNotification(false), 10000);
      } else {
        setError(`Insufficient ${toToken.symbol} in contract for this swap`);
      }
      return;
    }

    try {
      setIsLoading(true);
      setTxStatus('pending');
      setError('');

      let txHash = '';
      const amountWei = web3Utils.toWei(fromAmount);
      console.log('=== SWAP TRANSACTION DEBUG ===');
      console.log('From:', fromAmount, fromToken.symbol);
      console.log('To:', toToken.symbol);
      console.log('Amount in Wei:', amountWei);
      console.log('Contract Address:', BAM_SWAP_ADDRESS);
      console.log('User Address:', walletAddress);

      // Different swap functions based on token pair
      if (fromToken.symbol === 'USDT' && toToken.symbol === 'USDB') {
        // First approve USDT
        await approveToken(TOKEN_ADDRESSES.USDT, amountWei);
        // Then execute swap
        const data = web3Utils.encodeFunctionCall('swapUSDTToUSDB(uint256)', [amountWei]);
        console.log('USDT→USDB Function Data:', data);
        console.log('Function selector should be:', web3Utils.keccak256('swapUSDTToUSDB(uint256)'));
        
        // Check contract state before attempting swap
        try {
          // Test if contract is paused
          const pausedCheck = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{
              to: BAM_SWAP_ADDRESS,
              data: '0x5c975abb' // paused() function selector
            }, 'latest']
          });
          console.log('Contract paused status:', pausedCheck);
          
          // Test specific function pause status
          const usdtToUsdbPausedCheck = await (window as any).ethereum.request({
            method: 'eth_call', 
            params: [{
              to: BAM_SWAP_ADDRESS,
              data: '0x9fc8f73a' // swapUSDTToUSDBPaused() selector
            }, 'latest']
          });
          console.log('USDT→USDB swap paused:', usdtToUsdbPausedCheck);
          
          // Check if contract has sufficient USDB balance
          const usdbBalanceCheck = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{
              to: TOKEN_ADDRESSES.USDB,
              data: '0x70a08231000000000000000000000000' + BAM_SWAP_ADDRESS.substring(2) // balanceOf(contract)
            }, 'latest']
          });
          const contractUsdbBalance = parseInt(usdbBalanceCheck, 16);
          console.log('Contract USDB balance:', contractUsdbBalance / 1e18, 'USDB');
          
          // Check user USDT balance
          const userUsdtBalance = await (window as any).ethereum.request({
            method: 'eth_call',
            params: [{
              to: TOKEN_ADDRESSES.USDT,
              data: '0x70a08231000000000000000000000000' + walletAddress.substring(2) // balanceOf(user)
            }, 'latest']
          });
          const userBalance = parseInt(userUsdtBalance, 16);
          console.log('User USDT balance:', userBalance / 1e18, 'USDT');
          
          // Check if user has enough balance
          const requiredAmount = parseInt(amountWei, 16);
          if (userBalance < requiredAmount) {
            console.error('Insufficient USDT balance!');
            setError('Insufficient USDT balance for this swap');
            return;
          }
          
          console.log('✅ All checks passed - proceeding with swap transaction');
          
        } catch (error) {
          console.log('Contract state check failed:', error);
        }
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
      setTxStatus('pending');
      
      // Wait for blockchain confirmation
      console.log('⏳ Waiting for blockchain confirmation...');
      try {
        await waitForTransactionConfirmation(txHash);
        setTxStatus('success');
        console.log('✅ Transaction confirmed on blockchain');
        
        // Automatically add BAM token and show notification if user bought BAM
        if (toToken.symbol === 'BAM') {
          setTimeout(async () => {
            try {
              // Automatically add BAM token to wallet
              const result = await web3Utils.addTokenToWallet(
                TOKEN_ADDRESSES.BAM,
                'BAM',
                18,
                `${window.location.origin}/assets/bamToken_1752877645023.png`
              );
              
              if (result) {
                setShowAddTokenNotification(true);
                setTimeout(() => setShowAddTokenNotification(false), 4000);
              } else {
                // If auto-add fails, show manual option
                console.log('Auto-add failed, user can still manually add token');
              }
            } catch (error) {
              console.log('Auto-add BAM token failed:', error);
              // Silent failure - user can still manually add via button
            }
          }, 1500);
        }
        
        // Update balances after confirmed transaction
        setTimeout(() => {
          updateBalances(walletAddress);
          checkContractBalances(); // Also refresh contract balances
        }, 2000);
      } catch (confirmError) {
        console.error('Transaction confirmation failed:', confirmError);
        setTxStatus('error');
        setError('Transaction failed to confirm on blockchain');
      }
      
    } catch (error: any) {
      console.error('=== SWAP TRANSACTION FAILED ===');
      console.error('Error details:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Transaction failed';
      if (error && error.message) {
        errorMessage = error.message;
        
        // Check for gas-related errors
        if (error.message.includes('out of gas') || error.message.includes('gas required exceeds allowance')) {
          errorMessage = 'Transaction failed due to insufficient gas. Please try again.';
        }
        // Check for specific contract errors
        else if (error.message.includes('execution reverted')) {
          if (error.message.includes('insufficient')) {
            errorMessage = 'Insufficient balance or liquidity';
          } else if (error.message.includes('paused')) {
            errorMessage = 'Contract function is paused';
          } else if (error.message.includes('allowance')) {
            errorMessage = 'Token approval required';
          } else if (error.message.includes('Already purchased')) {
            errorMessage = 'You have already purchased BAM tokens with this wallet';
          } else if (error.message.includes('Must purchase exactly')) {
            errorMessage = 'BAM purchases require 2-5 USDT range';
          } else {
            errorMessage = 'Contract execution failed - check requirements';
          }
        }
        // Check for user rejection
        else if (error.message.includes('User rejected') || error.code === 4001) {
          errorMessage = 'Transaction cancelled by user';
        }
        // Check for network errors
        else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error - please check your connection and try again';
        }
      }
      
      setError(errorMessage);
      setTxStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for transaction confirmation
  const waitForTransactionConfirmation = async (txHash: string): Promise<void> => {
    const maxRetries = 60; // Wait up to 5 minutes (60 * 5 seconds)
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const receipt = await (window as any).ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
        
        if (receipt) {
          if (receipt.status === '0x1') {
            // Transaction successful
            return;
          } else {
            // Transaction failed
            throw new Error('Transaction failed on blockchain');
          }
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        retries++;
      } catch (error) {
        console.error('Error checking transaction status:', error);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Transaction confirmation timeout');
  };

  // Approve token spending
  const approveToken = async (tokenAddress: string, amount: string) => {
    const data = web3Utils.encodeFunctionCall('approve(address,uint256)', [BAM_SWAP_ADDRESS, amount]);
    const approveTxHash = await web3Utils.sendTransaction({
      to: tokenAddress,
      data,
      from: walletAddress
    });
    
    // Wait for approval confirmation before proceeding
    console.log('⏳ Waiting for token approval confirmation...');
    await waitForTransactionConfirmation(approveTxHash);
    console.log('✅ Token approval confirmed');
  };

  // Enhanced Token Selector with filtering and search like Uniswap
  const TokenSelector = ({ token, onSelect, label }: { token: TokenInfo; onSelect: (token: TokenInfo) => void; label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const availableTokens = Object.values(TOKENS);

    // Filter tokens based on swap rules (exclude BNB↔USDT)
    const getFilteredTokens = () => {
      return availableTokens.filter(tokenOption => {
        // Only exclude direct BNB↔USDT pairs, not BNB as an option entirely
        const otherToken = label === 'to' ? fromToken : toToken;
        
        // Prevent selecting USDT when other token is BNB
        if ((otherToken.symbol === 'BNB' && tokenOption.symbol === 'USDT') || 
            (otherToken.symbol === 'USDT' && tokenOption.symbol === 'BNB')) {
          return false;
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
              {typeof token.icon === 'string' && (token.icon.includes('.png') || token.icon.includes('.jpg') || token.icon.includes('.jpeg') || token.icon.startsWith('/') || token.icon.startsWith('data:')) ? (
                <img src={token.icon} alt={token.symbol} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
              ) : (
                <div className="text-base sm:text-lg">{token.icon}</div>
              )}
              <span className="font-semibold text-white text-sm sm:text-base">{token.symbol}</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700 w-[90vw] max-w-sm sm:max-w-md max-h-[75vh] overflow-hidden p-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-white text-base">
              Select a token
            </DialogTitle>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              type="text"
              placeholder="Search or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 py-2 text-sm bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Popular Tokens Section */}
          {!searchQuery && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 font-medium mb-2">Popular</div>
              <div className="grid grid-cols-4 gap-1">
                {popularTokens.slice(0, 4).map((tokenOption) => (
                  <Button
                    key={tokenOption.symbol}
                    variant="ghost"
                    className="flex flex-col items-center p-1.5 h-auto bg-gray-800/50 hover:bg-gray-700/50 rounded-md border border-gray-700"
                    onClick={() => {
                      onSelect(tokenOption);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {typeof tokenOption.icon === 'string' && (tokenOption.icon.includes('.png') || tokenOption.icon.includes('.jpg') || tokenOption.icon.includes('.jpeg') || tokenOption.icon.startsWith('/') || tokenOption.icon.startsWith('data:')) ? (
                      <img src={tokenOption.icon} alt={tokenOption.symbol} className="w-5 h-5 rounded-full mb-1" />
                    ) : (
                      <div className="text-base mb-1">{tokenOption.icon}</div>
                    )}
                    <span className="text-xs font-medium text-white">{tokenOption.symbol}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Token List */}
          <div className="space-y-0.5 max-h-56 overflow-y-auto">
            {!searchQuery && <div className="text-xs text-gray-400 font-medium mb-2">Your tokens</div>}
            
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
                    className={`w-full justify-start p-2 h-auto hover:bg-gray-800 ${
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
                    <div className="flex items-center space-x-2 w-full">
                      {typeof tokenOption.icon === 'string' && (tokenOption.icon.includes('.png') || tokenOption.icon.includes('.jpg') || tokenOption.icon.includes('.jpeg') || tokenOption.icon.startsWith('/') || tokenOption.icon.startsWith('data:')) ? (
                        <img src={tokenOption.icon} alt={tokenOption.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="text-lg flex-shrink-0">{tokenOption.icon}</div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center space-x-1.5 relative">
                          <span className="font-semibold text-white text-sm">{tokenOption.symbol}</span>
                          {tokenOption.symbol === 'BAM' && (
                            <>
                              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400 px-1 py-0">
                                $0.000001
                              </Badge>
                              {/* Tiny tooltip notification near BAM label */}
                              {hasAlreadyPurchased && showPurchasedWarning && (
                                <div className="absolute -top-7 left-12 z-50 animate-fadeIn">
                                  <div className="bg-red-500/95 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-red-400/50">
                                    Already purchased
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{tokenOption.name}</div>
                        {isInvalidPair && (
                          <div className="text-xs text-red-400">
                            Direct BNB↔USDT not supported
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {balances[tokenOption.symbol] !== undefined ? (
                          <>
                            <div className="text-xs font-medium text-white">
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
                            Connect
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
          <div className="mt-3 pt-2 border-t border-gray-700">
            <Button variant="ghost" className="w-full text-gray-400 hover:text-white py-2 text-xs">
              <Settings className="w-3 h-3 mr-1.5" />
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
                  src="/assets/bamToken_1753182165828.png" 
                  alt="BAM Token" 
                  className="h-8 w-8 rounded-full"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold gradient-text">BAM Swap</span>
                  <span className="bg-gradient-to-r from-green-400 to-green-600 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    Live
                  </span>
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
                    <DropdownMenuItem onClick={addBAMTokenToWallet} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Add BAM
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
                    <a 
                      href="https://apex.bam-ecosystem.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-purple-400 transition-colors flex items-center"
                    >
                      <span className="mr-2">⛏️</span>
                      BAM ApexMiner
                    </a>
                    <a 
                      href="https://vip.bam-ecosystem.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-yellow-400 transition-colors flex items-center"
                    >
                      <span className="mr-2">👑</span>
                      BAM VIP Access
                    </a>
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
                          <div className="grid grid-cols-2 gap-2">
                            <Button onClick={copyAddress} variant="outline" className="text-gray-300 border-gray-600 text-xs">
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                            <Button onClick={addBAMTokenToWallet} variant="outline" className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Add BAM
                            </Button>
                          </div>
                          <Button onClick={disconnectWallet} variant="outline" className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs">
                            <LogOut className="w-3 h-3 mr-1" />
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



      {/* Page Entry Loader */}
      {showPageLoader && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="glassmorphism-golden rounded-3xl p-12 text-center max-w-md mx-4">
            <div className="relative flex items-center justify-center mb-8">
              <img 
                src="/assets/bamToken_1753182165828.png" 
                alt="BAM Token" 
                className="w-24 h-24 rounded-full animate-swap-rotate"
              />
              <div className="absolute -top-4 -left-8 text-3xl animate-money-fly">💰</div>
              <div className="absolute -top-4 -right-8 text-3xl animate-money-fly" style={{animationDelay: '0.3s'}}>💎</div>
              <div className="absolute -bottom-4 -left-8 text-3xl animate-money-fly" style={{animationDelay: '0.6s'}}>🚀</div>
              <div className="absolute -bottom-4 -right-8 text-3xl animate-money-fly" style={{animationDelay: '0.9s'}}>⚡</div>
            </div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">BAM Ecosystem</h1>
            <p className="text-xl text-yellow-200 font-bold mb-2">
              BUILD AND MULTIPLY Wealth Together
            </p>
            <p className="text-sm text-yellow-300/90 mb-6">
              Welcome to the community-driven DeFi revolution
            </p>
            <div className="w-full bg-yellow-900/50 rounded-full h-4 border border-yellow-600/30">
              <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 h-full rounded-full animate-progress-fill shadow-inner"></div>
            </div>
            <p className="text-xs text-yellow-300 mt-3">Initializing swap interface...</p>
          </div>
        </div>
      )}

      {/* Main Content - Properly sized and centered for desktop */}
      <div className="p-2 sm:p-4 pt-20 sm:pt-24 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-sm xl:max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-1 sm:mb-2 xl:mb-3">
          <p className="text-xs text-gray-400 mb-0.5 sm:mb-1 xl:mb-2">Pioneering Community Growth and Wealth</p>
          {priceInfo && (
            <div className="flex justify-center items-center space-x-2 mb-0.5 sm:mb-1 xl:mb-2 text-xs">
              <Badge variant="outline" className="text-green-400 border-green-400 px-1.5 py-0.5">
                <TrendingUp className="w-2 h-2 mr-0.5" />
                BNB ${priceInfo.bnbPrice.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400 px-1.5 py-0.5">
                <Activity className="w-2 h-2 mr-0.5" />
                BAM $0.000001
              </Badge>
            </div>
          )}
        </div>

        {/* Success Notification for Adding BAM Token */}
        {showAddTokenNotification && (
          <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-green-500/90 border border-green-400 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-white">
                <CheckCircle className="w-4 h-4" />
                <div className="text-sm">
                  <div className="font-medium">BAM Token Added!</div>
                  <div className="text-xs opacity-90">Check your wallet assets</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animated BAM Loader */}
        {showLoader && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glassmorphism-golden rounded-2xl p-8 text-center max-w-sm mx-4">
              <div className="relative flex items-center justify-center mb-6">
                <img 
                  src="/assets/bamToken_1753182165828.png" 
                  alt="BAM Token" 
                  className="w-16 h-16 rounded-full animate-swap-rotate"
                />
                <div className="absolute -left-6 text-yellow-400 animate-money-fly">💰</div>
                <div className="absolute -right-6 text-yellow-400 animate-money-fly" style={{animationDelay: '0.5s'}}>💎</div>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Processing BAM Swap</h3>
              <p className="text-yellow-200 text-sm">Building wealth together...</p>
              <div className="mt-4 w-full bg-yellow-900/30 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        )}

        {/* Success Celebration */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glassmorphism-golden rounded-2xl p-8 text-center max-w-md mx-4 animate-celebration">
              <div className="relative flex items-center justify-center mb-6">
                <img 
                  src="/assets/bamToken_1753182165828.png" 
                  alt="BAM Token" 
                  className="w-20 h-20 rounded-full animate-pulse-slow"
                />
                <div className="absolute -top-2 -right-2 text-3xl">🎉</div>
                <div className="absolute -bottom-2 -left-2 text-3xl">🚀</div>
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">🎉 Congratulations!</h3>
              <p className="text-yellow-200 mb-4">Welcome to the BAM community family!</p>
              <div className="space-y-3 text-sm text-yellow-300">
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">Together we stand, In BAM We Trust!</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Thank you for helping our community grow!</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">Share this to all your friends!</span>
                </div>
                <div className="text-center text-yellow-200 text-xs mt-2 italic">
                  Don't keep this opportunity to yourself!
                </div>
              </div>
              <button 
                onClick={() => setShowCelebration(false)}
                className="mt-6 px-6 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              >
                Continue Building 🏗️
              </button>
            </div>
          </div>
        )}

        {/* Purchase Guide - Auto-dismiss */}
        {showPurchaseGuide && ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') || 
          (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM')) && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none animate-fadeIn">
            <div className="bg-yellow-500/90 border border-yellow-400 rounded-lg p-3 backdrop-blur-sm max-w-sm notification-compact">
              <div className="flex items-start space-x-2 text-black">
                <div className="text-xs">
                  <div className="font-bold">BAM Purchase: 2-5 USDT = 2M-5M BAM</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Warning Notification */}
        {showBalanceWarning && (
          <div className="fixed top-32 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-orange-500/90 border border-orange-400 rounded-lg p-4 backdrop-blur-sm max-w-sm">
              <div className="flex items-start space-x-3 text-white">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-bold mb-1">Presale 2 Ending Soon!</div>
                  <div className="text-xs opacity-90 leading-relaxed">
                    Limited spots left in Presale 2! Buy 2-5 USDT worth of BAM at $0.000001 before Presale 3 → Final Uniswap & PancakeSwap launch!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Notification */}
        {showMilestoneNotification && (
          <div className="fixed top-44 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 border border-yellow-400 rounded-lg p-4 backdrop-blur-sm max-w-sm">
              <div className="flex items-start space-x-3 text-white">
                <Trophy className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-bold mb-1">Community Milestone!</div>
                  <div className="text-xs opacity-90 leading-relaxed">
                    {milestoneMessage}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Presale Status Banner */}
        <div className="mb-4 mx-auto max-w-sm sm:max-w-md lg:max-w-sm xl:max-w-md">
          <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-yellow-400 font-bold text-sm">PRESALE 2 ACTIVE</div>
                  <div className="text-yellow-200 text-xs leading-tight">
                    {contractBalances.BAM ? (
                      <>PRESALE 2 ACTIVE: $0.000001 per BAM • 2-5 USDT = 2M-5M BAM • Next: Presale 3 → Uniswap & PancakeSwap</>
                    ) : (
                      <>Presale 2 Complete! • Next: Presale 3 → Final Uniswap & PancakeSwap Launch</>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Main Swap Card - Compact desktop sizing */}
        <Card className="glassmorphism border-amber-500/40">
          <CardContent className="p-4 sm:p-5 lg:p-4 xl:p-5">
            {/* Header with Trade Types */}
            <div className="flex justify-between items-center mb-1.5 sm:mb-3">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button variant="default" className="bg-gray-800 text-white border-yellow-500 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-8">
                  Swap
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-8">
                  Limit
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-8 hidden sm:block">
                  Buy
                </Button>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-7 sm:h-8 hidden sm:block">
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowLimitsModal(true)}
                        className="text-gray-400 hover:text-white p-1 h-6 w-6"
                      >
                        <Info className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 border-gray-600 text-white max-w-xs">
                      <div className="space-y-1 text-xs">
                        <div>Click for detailed swap limits and requirements</div>
                        <div>Fixed fees: 0.5% (USDT→USDB/BAM, BNB→BAM)</div>
                        <div>Higher fees: 1.5% (USDB→USDT, BAM→USDT/BNB)</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-0.5 sm:space-y-2 mb-1.5 sm:mb-3">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-medium text-gray-300">From</label>
                {balances[fromToken.symbol] && (
                  <button
                    onClick={() => setFromAmount(balances[fromToken.symbol])}
                    className="text-xs sm:text-sm text-yellow-400 hover:text-yellow-300"
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
                  className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold bg-transparent border-none text-white h-10 sm:h-14 lg:h-12 xl:h-14 pr-24 sm:pr-32 focus:ring-0 focus:border-none"
                  step="any"
                  readOnly={toToken.symbol === 'BAM' && fromToken.symbol === 'BNB'}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <TokenSelector token={fromToken} onSelect={setFromToken} label="from" />
                </div>
              </div>
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <div className="text-xs sm:text-sm text-gray-400 px-1">
                  {calculateUSDValue(fromAmount, fromToken.symbol)}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-0.5 sm:my-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={swapTokens}
                className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600"
              >
                <ArrowUpDown className="w-3 h-3" />
              </Button>
            </div>





            {/* To Token */}
            <div className="space-y-0.5 sm:space-y-2 mb-1.5 sm:mb-3">
              <label className="text-xs sm:text-sm font-medium text-gray-300">To</label>
              <div className="relative">
                <Input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0"
                  className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold bg-transparent border-none text-white h-10 sm:h-14 lg:h-12 xl:h-14 pr-24 sm:pr-32 focus:ring-0 focus:border-none"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <TokenSelector token={toToken} onSelect={setToToken} label="to" />
                </div>
              </div>
              {toAmount && parseFloat(toAmount) > 0 && (
                <div className="text-xs sm:text-sm text-gray-400 px-1">
                  {calculateUSDValue(toAmount, toToken.symbol)}
                </div>
              )}
            </div>

            {/* Enhanced Quote Information */}
            {quote && (
              <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg p-1.5 sm:p-2 mb-1.5 sm:mb-2 border border-gray-600/50">
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

            {/* Enhanced Connect/Swap Button with Improved Validation */}
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
            ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Enter an amount
              </Button>
            ) : parseFloat(fromAmount) < 1 && (fromToken.symbol === 'USDT' || fromToken.symbol === 'USDB') ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-red-700 text-red-200 rounded-lg cursor-not-allowed"
              >
                ❌ Minimum: 1 {fromToken.symbol}
              </Button>
            ) : hasAlreadyPurchased && ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') || (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM')) ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-red-600 text-red-200 rounded-lg cursor-not-allowed"
              >
                🚫 Already Purchased - One Per Wallet
              </Button>
            ) : ((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') && 
                  (parseFloat(fromAmount) < 2 || parseFloat(fromAmount) > 5)) ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-orange-700 text-orange-200 rounded-lg cursor-not-allowed"
              >
                ⚠️ BAM requires 2-5 USDT
              </Button>
            ) : ((fromToken.symbol === 'BNB' && toToken.symbol === 'BAM') && !priceInfo) ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Loading price data...
              </Button>
            ) : parseFloat(fromAmount) > 1 && (fromToken.symbol === 'USDT' || fromToken.symbol === 'USDB') && toToken.symbol !== 'BAM' ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-orange-700 text-orange-200 rounded-lg cursor-not-allowed"
              >
                ⚠️ Maximum: 1 {fromToken.symbol} per wallet
              </Button>
            ) : balances[fromToken.symbol] && parseFloat(fromAmount) > parseFloat(balances[fromToken.symbol]) ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-red-700 text-red-200 rounded-lg cursor-not-allowed"
              >
                💰 Insufficient {fromToken.symbol} balance
              </Button>
            ) : (fromToken.symbol === 'BAM' && (toToken.symbol === 'USDT' || toToken.symbol === 'BNB') && 
                 contractStatus && (contractStatus.functionPaused.bamToUsdt || contractStatus.functionPaused.bamToBnb)) ? (
              <Button
                disabled
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold bg-red-600 text-red-200 rounded-lg cursor-not-allowed"
              >
                🚫 Not Yet Allowed - BAM Selling Disabled
              </Button>
            ) : (
              <Button
                onClick={executeSwap}
                disabled={isLoading}
                className="w-full h-10 sm:h-12 lg:h-11 xl:h-12 text-sm sm:text-base lg:text-sm xl:text-base font-bold bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span>
                      {((fromToken.symbol === 'USDT' && toToken.symbol === 'BAM') || 
                        (fromToken.symbol === 'BNB' && toToken.symbol === 'BAM')) ? 
                        'Buy BAM Tokens' : 'Review Swap'}
                    </span>
                    <div className="text-xs opacity-80 mt-0.5">
                      {formatDisplayAmount(fromAmount, fromToken.symbol)} {fromToken.symbol} → {formatDisplayAmount(toAmount || '0', toToken.symbol)} {toToken.symbol}
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
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Waiting for blockchain confirmation...</span>
                      </div>
                      {txHash && (
                        <div className="mt-1">
                          <a
                            href={`https://bscscan.com/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline hover:text-yellow-200"
                          >
                            View on BSCScan
                          </a>
                        </div>
                      )}
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

      {/* Comprehensive Limits & Requirements Modal */}
      <Dialog open={showLimitsModal} onOpenChange={setShowLimitsModal}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-yellow-400" />
              <span>BAM Swap - Limits & Requirements</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* BAM Purchase Limits */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                BAM Token Purchase Limits (CRITICAL)
                {!contractData && walletAddress && (
                  <div className="ml-2 w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                )}
              </h3>
              <div className="space-y-2 text-sm text-yellow-200">
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div><span className="font-medium">Purchase Range:</span> {contractData ? `${contractData.minPurchase}-${contractData.maxPurchase} USDT` : '2-5 USDT'} (or equivalent BNB)</div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div><span className="font-medium">One-Time Purchase:</span> Only one purchase per wallet address allowed</div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div><span className="font-medium">BAM Reward:</span> {contractData ? `${Number(contractData.bamPerUSDT).toLocaleString()} BAM per USDT` : '1,000,000 BAM per USDT (Presale 2 rate)'}</div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div><span className="font-medium">No Repeats:</span> Cannot buy BAM again with same wallet</div>
                </div>
              </div>
            </div>

            {/* Contract Status */}
            {contractStatus && (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-gray-300 font-semibold mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Current Contract Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Main Contract:</span>
                    <span className={contractStatus.isPaused ? "text-red-400" : "text-green-400"}>
                      {contractStatus.isPaused ? "Paused" : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BAM Purchases:</span>
                    <span className={contractStatus.functionPaused.usdtToBam ? "text-red-400" : "text-green-400"}>
                      {contractStatus.functionPaused.usdtToBam ? "Paused" : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">USDT↔USDB Swaps:</span>
                    <span className={contractStatus.functionPaused.usdtToUsdb ? "text-red-400" : "text-green-400"}>
                      {contractStatus.functionPaused.usdtToUsdb ? "Paused" : "Active"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Last checked: {new Date(contractStatus.lastChecked).toLocaleTimeString()}
                    {contractData && (
                      <div>Live data updated: {new Date(contractData.lastUpdated).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fee Structure */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Fee Structure
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-green-300 font-medium mb-1">Low Fees (0.5%):</div>
                  <div className="text-green-200 ml-4 space-y-1">
                    <div>• USDT → USDB</div>
                    <div>• USDT → BAM</div>
                    <div>• BNB → BAM</div>
                  </div>
                </div>
                <div>
                  <div className="text-red-300 font-medium mb-1">Higher Fees (1.5%):</div>
                  <div className="text-red-200 ml-4 space-y-1">
                    <div>• USDB → USDT</div>
                    <div>• BAM → USDT</div>
                    <div>• BAM → BNB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Market Data */}
            {priceInfo && (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <h3 className="text-gray-300 font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Current Market Data
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">BNB Price</div>
                    <div className="text-green-400 font-medium">${priceInfo.bnbPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">BAM Price</div>
                    <div className="text-yellow-400 font-medium">${contractData ? contractData.bamPrice : '0.000001'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">BNB for 1 USDT</div>
                    <div className="text-blue-400 font-medium">~{(1 / priceInfo.bnbPrice).toFixed(6)} BNB</div>
                  </div>
                  <div>
                    <div className="text-gray-400">BAM per USDT</div>
                    <div className="text-purple-400 font-medium">{contractData ? Number(contractData.bamPerUSDT).toLocaleString() : '1,000,000'}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLimitsModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setFromAmount(contractData ? contractData.minPurchase : '2');
                  setFromToken(TOKENS.USDT);
                  setToToken(TOKENS.BAM);
                  setShowLimitsModal(false);
                }}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
              >
                Set Up BAM Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default SwapPage;