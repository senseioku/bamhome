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
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Utility functions
  toWei(amount: string, decimals: number = 18): string {
    const factor = Math.pow(10, decimals);
    const wei = Math.floor(parseFloat(amount) * factor);
    return `0x${wei.toString(16)}`;
  }

  fromWei(wei: string, decimals: number = 18): string {
    const factor = Math.pow(10, decimals);
    const amount = parseInt(wei, 16) / factor;
    return amount.toString();
  }

  formatAmount(amount: string, decimals: number = 4): string {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(decimals);
  }

  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export const web3Utils = new Web3Utils();

// Encode function calls for contract interactions
export class ContractEncoder {
  static encodeFunctionCall(functionSignature: string, params: any[] = []): string {
    // Simple function signature to selector conversion
    const signature = functionSignature.split('(')[0];
    let selector = '';
    
    // Common function selectors for our contract
    const selectors: Record<string, string> = {
      'getContractInfo': '0x15755587',
      'getBAMPrice': '0x8e15f473',
      'getMinimumPurchase': '0x7dc0d1d0',
      'getMinimumSwap': '0x8426c3b7',
      'calculateBAMFromUSDT': '0x9a7c4b5e',
      'getBNBPriceWithValidation': '0x4e71d92d',
      'swapUSDTToUSDB': '0x5c6e4e2b',
      'swapUSDBToUSDT': '0x7d64bcb4',
      'buyBAMWithUSDT': '0x3d4e2e7c',
      'buyBAMWithBNB': '0x9b3e47f4',
      'sellBAMForUSDT': '0x8f4e4d7a',
      'sellBAMForBNB': '0x6d5e3f8b',
      'balanceOf': '0x70a08231',
      'approve': '0x095ea7b3',
      'allowance': '0xdd62ed3e',
    };

    selector = selectors[signature] || '0x';
    
    // Encode parameters (simplified for common types)
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