# Deploy BAM Swap Contract Right Now

## Quick Deployment (5 minutes)

### Step 1: Setup Environment (2 minutes)
```bash
cd contracts
cp .env.example .env
```

Edit `.env` file with your credentials:
```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Step 2: Deploy to BSC Mainnet (2 minutes)
```bash
# Install dependencies
npm install

# Deploy contract
npx hardhat run scripts/deploy.js --network bsc
```

Expected output:
```
Deploying BAM Swap Contract...
Network: bsc
Deploying with account: 0x...
Account balance: 0.05 BNB
BAM Swap deployed to: 0x1234567890123456789012345678901234567890
```

### Step 3: Verify on BSCScan (1 minute)
```bash
# Replace with your actual contract address
npx hardhat verify --network bsc 0x1234567890123456789012345678901234567890
```

## Get Required Credentials

### Private Key
- Export from MetaMask: Settings → Security & Privacy → Export Private Key
- Or use your preferred BSC wallet's export function

### BSCScan API Key
- Visit: https://bscscan.com/apis
- Create free account
- Generate API key

### BNB Balance
- Need minimum 0.01 BNB for deployment
- Deployment typically costs ~0.005-0.01 BNB

## Contract Ready Features

✅ All BSC mainnet addresses configured
✅ Differential fee structure (0.5%/1.5%)
✅ Payment distribution (90% to recipient)
✅ Individual pause controls
✅ Chainlink price feeds
✅ Emergency controls
✅ BSCScan verification ready

## That's It!

Your BAM Swap contract will be live on BSC mainnet in under 5 minutes.