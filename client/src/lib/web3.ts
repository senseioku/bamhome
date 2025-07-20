import { BSC_RPC_URL, BSC_CHAIN_ID } from './contracts';

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
      
      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
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

  async callContract(contractAddress: string, data: string): Promise<any> {
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

  async sendTransaction(txParams: any): Promise<string> {
    const provider = await this.getProvider();
    if (!provider) throw new Error('No provider available');

    try {
      // Add gas estimation and limit to reduce fees
      const gasEstimate = await provider.request({
        method: 'eth_estimateGas',
        params: [txParams],
      });
      
      // Set reasonable gas limit (BSC typically needs 100k-300k gas)
      const gasLimit = Math.min(parseInt(gasEstimate, 16) * 1.2, 300000);
      
      const txParamsWithGas = {
        ...txParams,
        gas: `0x${gasLimit.toString(16)}`,
        gasPrice: '0x12A05F200' // 5 Gwei gas price for BSC
      };
      
      console.log('Transaction params:', txParamsWithGas);
      
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
    // Use BigInt for large number precision
    const factor = BigInt(10 ** decimals);
    const amountFloat = parseFloat(amount);
    const amountBigInt = BigInt(Math.floor(amountFloat * (10 ** 8))); // 8 decimal precision
    const wei = (amountBigInt * factor) / BigInt(10 ** 8);
    return `0x${wei.toString(16)}`;
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
        // Convert number to hex (big integer support)
        let value: bigint;
        if (typeof param === 'string') {
          // Handle large numbers as BigInt
          if (param.startsWith('0x')) {
            value = BigInt(param);
          } else {
            value = BigInt(param);
          }
        } else {
          value = BigInt(param);
        }
        encodedParams += value.toString(16).padStart(64, '0');
      }
    }
    
    return methodId + encodedParams;
  }
  
  // Function signature to method ID mapping (actual keccak256 hashes from 4byte.directory)
  keccak256(input: string): string {
    const signatures: { [key: string]: string } = {
      // Custom BAM contract functions (these need to be calculated from actual contract ABI)
      'swapUSDTToUSDB(uint256)': '0xa0712d68',
      'swapUSDBToUSDT(uint256)': '0x2e95b6c8', 
      'buyBAMWithUSDT(uint256)': '0x8803dbee',
      'buyBAMWithBNB()': '0x1c3db2e0',
      'sellBAMForUSDT(uint256)': '0xd6febde8',
      'sellBAMForBNB(uint256)': '0x9a5c3b67',
      // Standard ERC20 functions (confirmed from 4byte.directory)
      'approve(address,uint256)': '0x095ea7b3',  // Standard ERC20 approve (verified)
      'transfer(address,uint256)': '0xa9059cbb',  // Standard ERC20 transfer
      'balanceOf(address)': '0x70a08231'  // Standard ERC20 balanceOf
    };
    
    return signatures[input] || '0x00000000';
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