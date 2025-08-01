import Web3 from 'web3';
import { TOKEN_ADDRESSES } from './contracts';

export interface WalletVerification {
  isValid: boolean;
  address?: string;
  bamBalance?: string;
  error?: string;
}

export class WalletSecurityManager {
  private static instance: WalletSecurityManager;
  private verifiedSessions: Map<string, { timestamp: number; address: string }> = new Map();
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
  private readonly MIN_BAM_REQUIREMENT = '10000000'; // 10M BAM tokens

  static getInstance(): WalletSecurityManager {
    if (!WalletSecurityManager.instance) {
      WalletSecurityManager.instance = new WalletSecurityManager();
    }
    return WalletSecurityManager.instance;
  }

  async verifyWalletOwnership(expectedAddress: string): Promise<WalletVerification> {
    try {
      // Check if already verified and session is valid
      const sessionKey = expectedAddress.toLowerCase();
      const existingSession = this.verifiedSessions.get(sessionKey);
      
      if (existingSession && (Date.now() - existingSession.timestamp) < this.SESSION_TIMEOUT) {
        return {
          isValid: true,
          address: expectedAddress,
          bamBalance: await this.getBAMBalance(expectedAddress)
        };
      }

      // Get Web3 provider
      if (!(window as any).ethereum) {
        return {
          isValid: false,
          error: 'No Web3 wallet detected. Please install MetaMask or another Web3 wallet.'
        };
      }

      const web3 = new Web3((window as any).ethereum);
      
      // Request account access
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        return {
          isValid: false,
          error: 'No wallet accounts found. Please connect your wallet.'
        };
      }

      const currentAddress = accounts[0].toLowerCase();
      if (currentAddress !== expectedAddress.toLowerCase()) {
        return {
          isValid: false,
          error: 'Connected wallet address does not match expected address.'
        };
      }

      // Verify BAM token balance
      const bamBalance = await this.getBAMBalance(expectedAddress);
      const balanceInTokens = parseFloat(bamBalance);
      
      if (balanceInTokens < parseFloat(this.MIN_BAM_REQUIREMENT)) {
        return {
          isValid: false,
          error: `Insufficient BAM tokens. You need at least ${this.MIN_BAM_REQUIREMENT} BAM tokens to access BAM AIGPT.`
        };
      }

      // Create signature challenge
      const message = `Verify ownership of ${expectedAddress} for BAM AIGPT access at ${Date.now()}`;
      
      try {
        const signature = await web3.eth.personal.sign(message, expectedAddress, '');
        
        // Verify signature
        const recoveredAddress = await web3.eth.personal.ecRecover(message, signature);
        
        if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
          return {
            isValid: false,
            error: 'Signature verification failed. Please try again.'
          };
        }

        // Store verified session
        this.verifiedSessions.set(sessionKey, {
          timestamp: Date.now(),
          address: expectedAddress
        });

        return {
          isValid: true,
          address: expectedAddress,
          bamBalance
        };

      } catch (signError: any) {
        return {
          isValid: false,
          error: 'Signature rejected. Please sign the message to verify wallet ownership.'
        };
      }

    } catch (error: any) {
      console.error('Wallet verification error:', error);
      return {
        isValid: false,
        error: 'Failed to verify wallet. Please ensure you have a Web3 wallet connected.'
      };
    }
  }

  private async getBAMBalance(address: string): Promise<string> {
    try {
      const web3 = new Web3('https://bsc-dataseed1.binance.org/');
      
      // BAM token contract ABI (ERC20 standard)
      const tokenABI = [
        {
          "constant": true,
          "inputs": [{"name": "_owner", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"name": "balance", "type": "uint256"}],
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "decimals",
          "outputs": [{"name": "", "type": "uint8"}],
          "type": "function"
        }
      ];

      const tokenContract = new web3.eth.Contract(tokenABI as any, TOKEN_ADDRESSES.BAM);
      const balance = await tokenContract.methods.balanceOf(address).call();
      const decimals = await tokenContract.methods.decimals().call();
      
      // Convert balance from wei to token units
      const balanceInTokens = Web3.utils.fromWei((balance as any).toString(), 'ether');
      
      return balanceInTokens;
    } catch (error) {
      console.error('Error getting BAM balance:', error);
      return '0';
    }
  }

  isSessionValid(address: string): boolean {
    const sessionKey = address.toLowerCase();
    const session = this.verifiedSessions.get(sessionKey);
    
    if (!session) return false;
    
    const isExpired = (Date.now() - session.timestamp) >= this.SESSION_TIMEOUT;
    if (isExpired) {
      this.verifiedSessions.delete(sessionKey);
      return false;
    }
    
    return true;
  }

  clearSession(address: string): void {
    const sessionKey = address.toLowerCase();
    this.verifiedSessions.delete(sessionKey);
  }

  clearAllSessions(): void {
    this.verifiedSessions.clear();
  }
}

export const walletSecurity = WalletSecurityManager.getInstance();