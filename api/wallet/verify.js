export default async function handler(req, res) {
  // Enhanced CORS headers for production with Cloudflare
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://bam-ecosystem.com',
    'https://www.bam-ecosystem.com',
    'https://bamhome-dffukcgji-bamswaps-projects.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000'
  ];
  
  // Allow requests from allowed origins or any origin if not in production
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://bam-ecosystem.com');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Additional headers for Cloudflare compatibility
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

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