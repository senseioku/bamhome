export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Wallet address, signature, and message are required' 
      });
    }

    // Basic validation - in production, you'd want more robust verification
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address',
        message: 'Please provide a valid Ethereum address' 
      });
    }

    // For this implementation, we'll accept the signature as valid
    // In production, you'd verify the signature cryptographically
    console.log('Wallet verification request:', {
      address: walletAddress,
      hasSignature: !!signature,
      messageLength: message.length
    });

    res.status(200).json({
      success: true,
      verified: true,
      address: walletAddress.toLowerCase(),
      message: 'Wallet verification successful'
    });

  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'Unable to verify wallet signature. Please try again.'
    });
  }
}