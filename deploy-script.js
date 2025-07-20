// Quick deployment script for BAM Swap Contract
const fs = require('fs');
const path = require('path');

// Check if we have the necessary tools
console.log('Checking deployment requirements...');

// Check if .env exists
const envPath = path.join('contracts', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found in contracts directory');
  console.log('Please copy .env.example to .env and configure your credentials');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const hasPrivateKey = envContent.includes('PRIVATE_KEY=') && !envContent.includes('PRIVATE_KEY=your_private_key');
const hasBscScanKey = envContent.includes('BSCSCAN_API_KEY=') && !envContent.includes('BSCSCAN_API_KEY=your_bscscan_api_key');

console.log('✅ Environment file found');
console.log(`${hasPrivateKey ? '✅' : '❌'} Private key configured`);
console.log(`${hasBscScanKey ? '✅' : '⚠️'} BSCScan API key configured`);

if (!hasPrivateKey) {
  console.error('❌ Please configure PRIVATE_KEY in contracts/.env');
  process.exit(1);
}

if (!hasBscScanKey) {
  console.warn('⚠️ BSCScan API key not configured - verification will fail');
}

console.log('\n🚀 Ready for deployment!');
console.log('Manual deployment steps:');
console.log('1. cd contracts');
console.log('2. npx hardhat run scripts/deploy.js --network bsc');
console.log('3. npx hardhat verify --network bsc <CONTRACT_ADDRESS>');