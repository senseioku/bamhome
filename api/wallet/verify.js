import { ethers } from 'ethers';

const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org/';
const BAM_TOKEN_ADDRESS = '0x4BA74Df6b4a74cb1A7c9F60b4e5c5c19d58A2DA0';

// BAM Token ABI (minimal for balanceOf)
const BAM_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: address, signature, message' 
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ 
        error: 'Invalid signature - signature does not match address' 
      });
    }

    // Check BAM token balance
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const bamContract = new ethers.Contract(BAM_TOKEN_ADDRESS, BAM_TOKEN_ABI, provider);
    
    const balance = await bamContract.balanceOf(address);
    const balanceInTokens = ethers.formatUnits(balance, 9); // BAM has 9 decimals
    const balanceNumber = parseFloat(balanceInTokens);

    const requiredBalance = 10000000; // 10M BAM tokens
    
    if (balanceNumber < requiredBalance) {
      return res.status(403).json({ 
        error: 'Insufficient BAM token balance',
        required: requiredBalance,
        current: balanceNumber,
        message: 'You need at least 10M BAM tokens to access BAM AIChat'
      });
    }

    res.status(200).json({
      success: true,
      address: address,
      bamBalance: balanceNumber,
      verified: true,
      message: 'Wallet successfully verified for BAM AIChat access'
    });

  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(500).json({ 
      error: 'Wallet verification failed',
      details: error.message 
    });
  }
}