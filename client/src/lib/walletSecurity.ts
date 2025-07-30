// Centralized wallet security verification system
// Prevents any wallet access without proper signature verification

import { Web3Utils } from './web3';

export interface WalletVerificationResult {
  isVerified: boolean;
  address: string;
  signature?: string;
  error?: string;
}

class WalletSecurityManager {
  private web3Utils: Web3Utils;
  private verifiedWallets: Set<string> = new Set();
  private sessionSignatures: Map<string, { signature: string; timestamp: number }> = new Map();
  
  // Session timeout: 1 hour
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000;

  constructor() {
    this.web3Utils = new Web3Utils();
  }

  /**
   * Comprehensive wallet verification - REQUIRED for all wallet access
   * This function MUST be called before setting any wallet address in state
   */
  async verifyWalletAccess(address: string, forceReVerification = false): Promise<WalletVerificationResult> {
    try {
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      
      // Check if wallet is already verified and session is valid
      if (!forceReVerification && this.isSessionValid(normalizedAddress)) {
        console.log('✅ Wallet session valid, skipping re-verification');
        return {
          isVerified: true,
          address: address,
          signature: this.sessionSignatures.get(normalizedAddress)?.signature
        };
      }

      // Always require fresh signature verification
      console.log('🔐 Performing mandatory wallet signature verification...');
      const signature = await this.web3Utils.verifyWalletOwnership(address);
      
      // Store verified wallet and signature
      this.verifiedWallets.add(normalizedAddress);
      this.sessionSignatures.set(normalizedAddress, {
        signature,
        timestamp: Date.now()
      });

      console.log('✅ Wallet verification successful');
      return {
        isVerified: true,
        address: address,
        signature
      };

    } catch (error: any) {
      console.error('❌ Wallet verification failed:', error);
      
      // Clear any previous verification for this wallet
      this.clearWalletVerification(address);
      
      return {
        isVerified: false,
        address: address,
        error: error.message || 'Verification failed'
      };
    }
  }

  /**
   * Check if a wallet session is still valid
   */
  private isSessionValid(normalizedAddress: string): boolean {
    const session = this.sessionSignatures.get(normalizedAddress);
    if (!session) return false;
    
    const now = Date.now();
    const isValid = (now - session.timestamp) < this.SESSION_TIMEOUT;
    
    if (!isValid) {
      // Session expired, clear it
      this.clearWalletVerification(normalizedAddress);
    }
    
    return isValid;
  }

  /**
   * Clear verification for a specific wallet
   */
  clearWalletVerification(address: string): void {
    const normalizedAddress = address.toLowerCase();
    this.verifiedWallets.delete(normalizedAddress);
    this.sessionSignatures.delete(normalizedAddress);
    console.log(`🗑️ Cleared verification for wallet: ${address}`);
  }

  /**
   * Clear all wallet verifications (useful for logout)
   */
  clearAllVerifications(): void {
    this.verifiedWallets.clear();
    this.sessionSignatures.clear();
    console.log('🗑️ Cleared all wallet verifications');
  }

  /**
   * Check if a wallet is currently verified (without re-verification)
   */
  isWalletVerified(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    return this.verifiedWallets.has(normalizedAddress) && this.isSessionValid(normalizedAddress);
  }

  /**
   * Secure auto-connection that ALWAYS requires signature verification
   * Use this instead of direct eth_accounts calls
   */
  async secureAutoConnect(): Promise<WalletVerificationResult | null> {
    try {
      const provider = await this.web3Utils.getProvider();
      if (!provider) return null;

      // Get connected accounts
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) return null;

      // ALWAYS verify the wallet - no exceptions
      console.log('🔄 Secure auto-connection attempting verification...');
      const result = await this.verifyWalletAccess(accounts[0], false);
      
      if (result.isVerified) {
        console.log('✅ Secure auto-connection successful');
      } else {
        console.warn('❌ Secure auto-connection failed verification');
      }
      
      return result;

    } catch (error: any) {
      console.error('❌ Secure auto-connection error:', error);
      return {
        isVerified: false,
        address: '',
        error: error.message || 'Auto-connection failed'
      };
    }
  }

  /**
   * Get verification status for debugging
   */
  getVerificationStatus(): {
    verifiedWallets: string[];
    activeSessions: number;
  } {
    return {
      verifiedWallets: Array.from(this.verifiedWallets),
      activeSessions: this.sessionSignatures.size
    };
  }
}

// Singleton instance to ensure consistent verification across the app
export const walletSecurity = new WalletSecurityManager();

// Helper function for components to use
export async function secureWalletConnect(): Promise<WalletVerificationResult> {
  const web3Utils = new Web3Utils();
  
  try {
    // First connect to wallet (this will trigger MetaMask popup if needed)
    const address = await web3Utils.connectWallet();
    
    // Then verify through security manager
    return await walletSecurity.verifyWalletAccess(address, true);
    
  } catch (error: any) {
    return {
      isVerified: false,
      address: '',
      error: error.message || 'Connection failed'
    };
  }
}

// Helper function for secure auto-connection
export async function secureAutoConnect(): Promise<WalletVerificationResult | null> {
  return await walletSecurity.secureAutoConnect();
}