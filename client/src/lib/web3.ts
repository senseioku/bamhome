// Constants to avoid circular dependency
const BSC_RPC_URL = "https://rpc.ankr.com/bsc";
const BSC_CHAIN_ID = 56;

// Browser-based Web3 utilities (no external dependencies)
export class Web3Utils {
  private provider: any = null;

  async getProvider() {
    if (typeof window === 'undefined') return null;
    
    // Check for MetaMask or other injected wallets
    if ((window as any).ethereum) {
      this.provider = (window as any).ethereum;
      return this.provider;
    }
    
    return null;
  }

  async connectWallet() {
    const provider = await this.getProvider();
    if (!provider) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      // Check and switch to BSC network if needed
      await this.switchToBSC();
      
      // Verify wallet can sign (prevents watch-only wallets)
      await this.verifyWalletOwnership(accounts[0]);
      
      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async verifyWalletOwnership(address: string) {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      // Create a comprehensive risk acknowledgment and verification message
      const timestamp = Date.now();
      const message = `BAM ApexMiner - Wallet Verification & Risk Acknowledgment

IMPORTANT: CRYPTOCURRENCY INVESTMENT RISKS
By signing this message, I acknowledge and accept:

• Cryptocurrency investments carry significant financial risk
• All profits depend entirely on market conditions and community support
• I must conduct my own research (DYOR) before making any investment decisions
• I understand that I may lose some or all of my investment
• I should only invest what I can afford to lose completely
• BAM ApexMiner is not responsible for any market-related losses
• Past performance does not guarantee future results
• Market volatility can result in rapid and substantial losses

I FULLY UNDERSTAND AND ACCEPT ALL RISKS INVOLVED.
I CONFIRM THAT I AM INVESTING ONLY WHAT I CAN AFFORD TO LOSE.

Address: ${address}
Timestamp: ${timestamp}

This signature verifies wallet ownership and does not authorize any transactions.`;
      
      // Request signature from wallet
      console.log('🔐 Requesting wallet signature for security verification...');
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });
      
      if (!signature) {
        throw new Error('Signature verification failed. Watch-only wallets cannot access BAM Swap.');
      }
      
      console.log('✅ Wallet ownership verified successfully');
      return signature;
      
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Signature rejected. BAM Swap requires wallet signature verification for security.');
      } else if (error.message?.includes('watch') || error.message?.includes('readonly')) {
        throw new Error('Watch-only wallets cannot access BAM Swap. Please use a wallet with signing capabilities.');
      } else {
        throw new Error('Failed to verify wallet ownership. Please ensure you have a signing-capable wallet.');
      }
    }
  }

  async switchToBSC() {
    const provider = await this.getProvider();
    if (!provider) return;

    try {
      // Try to switch to BSC
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BSC_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If BSC is not added, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${BSC_CHAIN_ID.toString(16)}`,
            chainName: 'BNB Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: [BSC_RPC_URL],
            blockExplorerUrls: ['https://bscscan.com/'],
          }],
        });
      }
    }
  }

  async getBalance(address: string, tokenAddress?: string): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      if (!tokenAddress) {
        // Get BNB balance
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        return this.fromWei(balance);
      } else {
        // Get token balance using contract call
        const balanceHex = await provider.request({
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: `0x70a08231000000000000000000000000${address.slice(2)}`
          }, 'latest'],
        });
        return this.fromWei(balanceHex);
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async callContract(contractAddress: string, abi: any, methodName: string, params: any[] = []): Promise<any> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      // Create contract instance using Web3
      const Web3 = (await import('web3')).default;
      const web3 = new Web3(provider);
      const contract = new web3.eth.Contract(abi, contractAddress);
      
      // Call the contract method
      const result = await contract.methods[methodName](...params).call();
      return result;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }

  async callContractRaw(contractAddress: string, data: string): Promise<any> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      const result = await provider.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data,
        }, 'latest'],
      });
      return result;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }

  async estimateGas(txParams: any): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      console.log('Estimating gas for transaction:', txParams);
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [txParams],
      });
      console.log('Raw gas estimate:', gasEstimate, 'decimal:', parseInt(gasEstimate, 16));
      // Add 50% buffer to the estimate for safety (increased from 20%)
      const gasLimit = Math.floor(parseInt(gasEstimate, 16) * 1.5);
      console.log('Final gas limit with buffer:', gasLimit);
      return `0x${gasLimit.toString(16)}`;
    } catch (error) {
      console.error('Gas estimation failed, using default:', error);
      
      // Enhanced fallback logic with specific handling for BNB to BAM
      if (txParams.data && txParams.data.includes('buyBAMWithBNB')) {
        console.log('Using high gas limit for BNB to BAM purchase');
        return '0x7A120'; // 500,000 gas for BNB to BAM purchases
      } else if (txParams.data && txParams.data.startsWith('0xa9059cbb')) {
        return '0x186A0'; // 100,000 for token transfers
      } else if (txParams.data && txParams.data.length > 2) {
        // Contract function call
        return '0x4C4B40'; // 500,000 for contract calls
      } else if (txParams.value && txParams.value !== '0x0') {
        return '0x5208'; // 21,000 for simple BNB transfers
      } else {
        return '0x4C4B40'; // 500,000 for complex operations
      }
    }
  }

  async sendTransaction(txParams: any): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      // Estimate gas dynamically
      const gasLimit = await this.estimateGas(txParams);
      
      // Use proper gas settings for BSC network
      const txParamsWithGas = {
        ...txParams,
        gas: gasLimit,
        gasPrice: '0x12A05F200' // 5 Gwei gas price (standard for BSC)
      };
      
      console.log('Transaction params with estimated gas:', txParamsWithGas);
      console.log('Gas limit:', parseInt(gasLimit, 16));
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParamsWithGas],
      });
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Utility functions
  toWei(amount: string, decimals: number = 18): string {
    try {
      // Handle decimal inputs properly
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }
      
      // Convert to string with enough precision
      const factor = Math.pow(10, decimals);
      const wei = Math.floor(amountNum * factor);
      
      return `0x${wei.toString(16)}`;
    } catch (error) {
      console.error('toWei conversion error:', error);
      return '0x0';
    }
  }

  fromWei(wei: string, decimals: number = 18): string {
    const factor = Math.pow(10, decimals);
    const amount = parseInt(wei, 16) / factor;
    return amount.toString();
  }

  // ABI encoding for contract functions
  encodeFunctionCall(signature: string, params: any[] = []): string {
    // Simple function signature to method ID conversion
    const methodId = this.keccak256(signature).slice(0, 10);
    
    // Encode parameters as hex
    let encodedParams = '';
    for (const param of params) {
      if (typeof param === 'string' && param.startsWith('0x')) {
        // Already hex-encoded value
        encodedParams += param.slice(2).padStart(64, '0');
      } else if (typeof param === 'string' && param.length === 42 && param.startsWith('0x')) {
        // Ethereum address
        encodedParams += param.slice(2).padStart(64, '0');
      } else {
        // Convert number to hex (big integer support) - FIXED
        let value: bigint;
        if (typeof param === 'string') {
          // Handle large decimal numbers as BigInt
          if (param.startsWith('0x')) {
            value = BigInt(param);
          } else {
            // This was the bug - we need to parse decimal string correctly
            value = BigInt(param);
          }
        } else {
          value = BigInt(param);
        }
        const hexValue = value.toString(16);
        encodedParams += hexValue.padStart(64, '0');
      }
    }
    
    return methodId + encodedParams;
  }
  
  // Function signature to method ID mapping using authentic keccak256
  keccak256(input: string): string {
    // Use real keccak256 from js-sha3 library
    try {
      const { keccak256: keccakHash } = require('js-sha3');
      const hash = keccakHash(input);
      return '0x' + hash.substring(0, 8);
    } catch (error) {
      console.error('Keccak256 error:', error);
      // Use the verified selectors from js-sha3 calculation
      const signatures: { [key: string]: string } = {
        'swapUSDTToUSDB(uint256)': '0xc34760df',  // Real keccak256
        'swapUSDBToUSDT(uint256)': '0x1f126943',  // Real keccak256 
        'buyBAMWithUSDT(uint256)': '0xae94dd91',  // Real keccak256
        'buyBAMWithBNB()': '0x1b398e7a',          // Real keccak256
        'sellBAMForUSDT(uint256)': '0xd6febde8',
        'sellBAMForBNB(uint256)': '0x9a5c3b67',
        'approve(address,uint256)': '0x095ea7b3',   // Verified working
        'transfer(address,uint256)': '0xa9059cbb',
        'balanceOf(address)': '0x70a08231'
      };
      return signatures[input] || '0x00000000';
    }
  }

  formatAmount(amount: string, decimals: number = 4): string {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    
    // For very large numbers (like BAM tokens), use readable formatting
    if (num >= 1e12) {
      return (num / 1e12).toFixed(1) + 'T';
    }
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    
    // For numbers with 6+ digits, remove decimals
    if (num >= 100000) {
      return Math.floor(num).toLocaleString();
    }
    
    // For very small numbers
    if (num < 0.0001) return '< 0.0001';
    
    // For regular numbers
    if (num >= 1) {
      return num.toFixed(Math.min(decimals, 2));
    }
    
    return num.toFixed(decimals);
  }

  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async addTokenToWallet(tokenAddress: string, tokenSymbol: string, tokenDecimals: number, tokenImage?: string) {
    const provider = await this.getProvider();
    if (!provider) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    try {
      const result = await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });
      
      return result;
    } catch (error) {
      console.error('Failed to add token to wallet:', error);
      throw error;
    }
  }
}

export const web3Utils = new Web3Utils();

// Simplified contract interaction using ethers-like interface
export class ContractEncoder {
  // Use ethers.js style function hashing
  static keccak256(text: string): string {
    // Simplified hash for function selectors - in production, use proper keccak256
    const selectors: Record<string, string> = {
      'getContractInfo()': '0x15755587',
      'getBAMPrice()': '0x5b7633d0',
      'getMinimumPurchase()': '0x2c4d4d6e',
      'getMinimumSwap()': '0x8426c3b7',
      'calculateBAMFromUSDT(uint256)': '0x9a7c4b5e',
      'getBNBPriceWithValidation()': '0x4e71d92d',
      'swapUSDTToUSDB(uint256)': '0x5c6e4e2b',
      'swapUSDBToUSDT(uint256)': '0x7d64bcb4',
      'buyBAMWithUSDT(uint256)': '0x3d4e2e7c',
      'buyBAMWithBNB()': '0x9b3e47f4',
      'sellBAMForUSDT(uint256)': '0x8f4e4d7a',
      'sellBAMForBNB(uint256)': '0x6d5e3f8b',
      'balanceOf(address)': '0x70a08231',
      'approve(address,uint256)': '0x095ea7b3',
      'allowance(address,address)': '0xdd62ed3e',
    };
    
    return selectors[text] || '0x00000000';
  }

  static encodeFunctionCall(functionSignature: string, params: any[] = []): string {
    const selector = this.keccak256(functionSignature);
    
    // Encode parameters
    let encodedParams = '';
    if (params.length > 0) {
      encodedParams = params.map(param => {
        if (typeof param === 'string' && param.startsWith('0x')) {
          return param.slice(2).padStart(64, '0');
        } else if (typeof param === 'number' || typeof param === 'bigint') {
          return param.toString(16).padStart(64, '0');
        } else if (typeof param === 'string' && web3Utils.isValidAddress(param)) {
          return param.slice(2).toLowerCase().padStart(64, '0');
        }
        return '0'.repeat(64);
      }).join('');
    }

    return selector + encodedParams;
  }

  static decodeResult(result: string, returnType: string): any {
    if (!result || result === '0x') return null;
    
    const data = result.slice(2);
    
    switch (returnType) {
      case 'uint256':
        return parseInt(data, 16).toString();
      case 'bool':
        return parseInt(data, 16) === 1;
      case 'address':
        return '0x' + data.slice(-40);
      case 'tuple':
        // For complex return types, we'll need to parse manually
        // This is a simplified version for getContractInfo
        const chunks = data.match(/.{64}/g) || [];
        return chunks.map(chunk => parseInt(chunk, 16).toString());
      default:
        return data;
    }
  }
}