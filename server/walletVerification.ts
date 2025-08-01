import { ethers } from "ethers";
import { keccak256 } from "js-sha3";

export interface WalletVerificationResult {
  isValid: boolean;
  address?: string;
  error?: string;
}

export class WalletVerificationService {
  private readonly VERIFICATION_MESSAGE = "BAM AIChat Authentication - Please sign this message to verify wallet ownership";

  /**
   * Verify wallet signature for authentication
   */
  async verifyWalletSignature(
    walletAddress: string,
    signature: string,
    timestamp?: number
  ): Promise<WalletVerificationResult> {
    try {
      // Validate wallet address format
      if (!ethers.isAddress(walletAddress)) {
        return {
          isValid: false,
          error: "Invalid wallet address format"
        };
      }

      // Validate signature format (should be hex string starting with 0x)
      if (!signature || !signature.startsWith('0x') || signature.length !== 132) {
        return {
          isValid: false,
          error: "Invalid signature format - must be 132 character hex string starting with 0x"
        };
      }

      // Create message with timestamp for replay attack prevention
      const message = timestamp 
        ? `${this.VERIFICATION_MESSAGE}\nTimestamp: ${timestamp}`
        : this.VERIFICATION_MESSAGE;

      // Recover signer address from signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      // Compare addresses (case-insensitive)
      const isValid = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();

      if (isValid) {
        return {
          isValid: true,
          address: recoveredAddress.toLowerCase()
        };
      } else {
        return {
          isValid: false,
          error: "Signature verification failed - wallet mismatch"
        };
      }

    } catch (error: any) {
      console.error("Wallet verification error:", error);
      
      // Provide more specific error messages
      if (error.code === 'INVALID_ARGUMENT') {
        return {
          isValid: false,
          error: "Invalid signature format - signature must be a valid hex string"
        };
      }
      
      return {
        isValid: false,
        error: `Signature verification failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Generate verification message for frontend
   */
  getVerificationMessage(timestamp?: number): string {
    return timestamp 
      ? `${this.VERIFICATION_MESSAGE}\nTimestamp: ${timestamp}`
      : this.VERIFICATION_MESSAGE;
  }

  /**
   * Validate timestamp to prevent replay attacks
   */
  isTimestampValid(timestamp: number, maxAgeMinutes: number = 10): boolean {
    const now = Date.now();
    const age = now - timestamp;
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    return age >= 0 && age <= maxAge;
  }
}

export const walletVerificationService = new WalletVerificationService();