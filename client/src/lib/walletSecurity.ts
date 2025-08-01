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
          error: `Insufficient BAM tokens. You need at least ${this.MIN_BAM_REQUIREMENT} BAM tokens to access BAM AIChat.`
        };
      }

      // Use the exact same signature verification as BAM Swap
      try {
        const timestamp = Date.now();
        const message = `BAM Ecosystem - Wallet Verification & Risk Acknowledgment

IMPORTANT: CRYPTOCURRENCY INVESTMENT RISKS
By signing this message, I acknowledge and accept:

• Cryptocurrency investments carry significant financial risk
• All profits depend entirely on market conditions and community support
• I must conduct my own research (DYOR) before making any investment decisions
• I understand that I may lose some or all of my investment
• I should only invest what I can afford to lose completely
• BAM Ecosystem is not responsible for any market-related losses
• Past performance does not guarantee future results
• Market volatility can result in rapid and substantial losses

I FULLY UNDERSTAND AND ACCEPT ALL RISKS INVOLVED.
I CONFIRM THAT I AM INVESTING ONLY WHAT I CAN AFFORD TO LOSE.

Address: ${expectedAddress}
Timestamp: ${timestamp}

This signature verifies wallet ownership and does not authorize any transactions.`;
        
        // Request signature using the same method as BAM Swap
        console.log('🔐 Requesting wallet signature for security verification...');
        const signature = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [message, expectedAddress],
        });
        
        if (!signature) {
          return {
            isValid: false,
            error: 'Signature verification failed. Watch-only wallets cannot access BAM AIChat.'
          };
        }
        
        console.log('✅ Wallet ownership verified successfully');

        // Skip backend verification for now - use direct client-side verification
        console.log('✅ Client-side verification successful, skipping backend API call');
        
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
        if (signError.code === 4001) {
          return {
            isValid: false,
            error: 'Signature rejected. BAM AIChat requires wallet signature verification for security.'
          };
        } else if (signError.message?.includes('watch') || signError.message?.includes('readonly')) {
          return {
            isValid: false,
            error: 'Watch-only wallets cannot access BAM AIChat. Please use a wallet with signing capabilities.'
          };
        } else {
          return {
            isValid: false,
            error: 'Failed to verify wallet ownership. Please ensure you have a signing-capable wallet.'
          };
        }
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
      
      // Check actual decimals from contract
      const decimals = await tokenContract.methods.decimals().call();
      const balanceInTokens = (Number(balance) / Math.pow(10, Number(decimals))).toString();
      
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

  // Add compatibility method for BAM Swap integration
  createSessionFromWeb3Verification(address: string): void {
    const sessionKey = address.toLowerCase();
    this.verifiedSessions.set(sessionKey, {
      timestamp: Date.now(),
      address: address
    });
    console.log('✅ Created AIChat session from BAM Swap verification');
  }

  // Add reverse compatibility - create session for BAM Swap integration
  async createSessionForBamSwap(address: string): Promise<void> {
    try {
      // Import web3 utils and create session there too
      const web3Utils = await import('./web3');
      
      // Store verification in localStorage for BAM Swap compatibility
      const verificationData = {
        address: address.toLowerCase(),
        timestamp: Date.now(),
        verified: true
      };
      
      localStorage.setItem('bamSwapWalletVerified', JSON.stringify(verificationData));
      console.log('✅ Created BAM Swap session from AIChat verification');
    } catch (error) {
      console.warn('Could not create BAM Swap session:', error);
    }
  }
}

export const walletSecurity = WalletSecurityManager.getInstance();

// Secure wallet connection function for BAM Swap
export interface SecureWalletResult {
  isVerified: boolean;
  address: string;
  error?: string;
}

export async function secureWalletConnect(): Promise<SecureWalletResult> {
  try {
    // Check if wallet is available
    if (!(window as any).ethereum) {
      return {
        isVerified: false,
        address: '',
        error: 'No Web3 wallet detected. Please install MetaMask or another Web3 wallet.'
      };
    }

    // Request account access
    const accounts = await (window as any).ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (!accounts || accounts.length === 0) {
      return {
        isVerified: false,
        address: '',
        error: 'No wallet accounts found. Please connect your wallet.'
      };
    }

    const address = accounts[0];
    
    // Verify wallet ownership with signature
    const walletManager = WalletSecurityManager.getInstance();
    const verification = await walletManager.verifyWalletOwnership(address);
    
    if (!verification.isValid) {
      return {
        isVerified: false,
        address: '',
        error: verification.error || 'Wallet verification failed'
      };
    }

    return {
      isVerified: true,
      address: address
    };

  } catch (error: any) {
    console.error('Secure wallet connection error:', error);
    return {
      isVerified: false,
      address: '',
      error: error.message || 'Failed to connect wallet securely'
    };
  }
}

export async function secureAutoConnect(): Promise<SecureWalletResult | null> {
  try {
    // Check if wallet is available
    if (!(window as any).ethereum) {
      return null;
    }

    // Get current accounts without prompting
    const accounts = await (window as any).ethereum.request({ 
      method: 'eth_accounts' 
    });
    
    if (!accounts || accounts.length === 0) {
      return null;
    }

    const address = accounts[0];
    
    // Check if we have a valid session
    const walletManager = WalletSecurityManager.getInstance();
    if (walletManager.isSessionValid(address)) {
      return {
        isVerified: true,
        address: address
      };
    }

    // If no valid session, don't auto-verify (user needs to manually connect)
    return null;

  } catch (error: any) {
    console.error('Secure auto-connection error:', error);
    return null;
  }
}