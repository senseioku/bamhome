import { ethers } from "ethers";

export interface SignatureResult {
  success: boolean;
  signature?: string;
  timestamp?: number;
  error?: string;
}

export interface VerificationMessageResponse {
  message: string;
  timestamp: number;
  expires: number;
}

export class WalletSignatureService {
  private readonly API_BASE = '/api/auth';

  /**
   * Get verification message from server
   */
  async getVerificationMessage(): Promise<VerificationMessageResponse> {
    const response = await fetch(`${this.API_BASE}/verification-message`);
    if (!response.ok) {
      throw new Error('Failed to get verification message');
    }
    return response.json();
  }

  /**
   * Sign message with wallet for authentication
   */
  async signMessage(walletAddress: string): Promise<SignatureResult> {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        return {
          success: false,
          error: 'MetaMask not detected. Please install MetaMask to continue.'
        };
      }

      // Get verification message from server
      const messageData = await this.getVerificationMessage();
      
      // Request signature from wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Ensure we're using the correct address
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return {
          success: false,
          error: 'Wallet address mismatch. Please ensure the correct wallet is connected.'
        };
      }

      // Sign the message
      const signature = await signer.signMessage(messageData.message);

      return {
        success: true,
        signature,
        timestamp: messageData.timestamp
      };

    } catch (error: any) {
      console.error('Wallet signature error:', error);
      
      if (error.code === 4001) {
        return {
          success: false,
          error: 'Signature request was rejected by user'
        };
      }
      
      return {
        success: false,
        error: `Signature failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Verify signature with server
   */
  async verifySignature(
    walletAddress: string, 
    signature: string, 
    timestamp: number
  ): Promise<{success: boolean, error?: string}> {
    try {
      const response = await fetch(`${this.API_BASE}/verify-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          timestamp
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.message || 'Verification failed' 
        };
      }

    } catch (error: any) {
      console.error('Signature verification error:', error);
      return {
        success: false,
        error: `Verification failed: ${error.message || 'Network error'}`
      };
    }
  }

  /**
   * Complete wallet authentication flow
   */
  async authenticateWallet(walletAddress: string): Promise<{
    success: boolean;
    signature?: string;
    timestamp?: number;
    error?: string;
  }> {
    try {
      // Step 1: Sign message
      const signResult = await this.signMessage(walletAddress);
      if (!signResult.success) {
        return signResult;
      }

      // Step 2: Verify signature with server
      const verifyResult = await this.verifySignature(
        walletAddress,
        signResult.signature!,
        signResult.timestamp!
      );

      if (verifyResult.success) {
        return {
          success: true,
          signature: signResult.signature,
          timestamp: signResult.timestamp
        };
      } else {
        return {
          success: false,
          error: verifyResult.error
        };
      }

    } catch (error: any) {
      console.error('Wallet authentication error:', error);
      return {
        success: false,
        error: `Authentication failed: ${error.message || 'Unknown error'}`
      };
    }
  }
}

export const walletSignatureService = new WalletSignatureService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}