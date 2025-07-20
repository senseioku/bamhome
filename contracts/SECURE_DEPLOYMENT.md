# Secure Deployment Guide for BAM Swap Contract

## Security Best Practices

### 1. Environment Setup
```bash
# Navigate to contracts directory
cd contracts

# Copy environment template
cp .env.example .env

# Edit with your secure credentials (NEVER commit this file)
nano .env
```

### 2. Required Environment Variables
```bash
# Your BSC wallet private key (without 0x prefix)
PRIVATE_KEY=abc123def456...

# BSCScan API key for contract verification
BSCSCAN_API_KEY=XYZ789...

# Optional: Custom gas settings
GAS_PRICE=5000000000  # 5 gwei
GAS_LIMIT=5000000     # 5M gas limit
```

### 3. Security Checklist
- [ ] ✅ **Private key stored in .env (not hardcoded)**
- [ ] ✅ **.env added to .gitignore**
- [ ] ✅ **Minimum 0.01 BNB balance for deployment**
- [ ] ✅ **BSCScan API key configured**
- [ ] ✅ **Gas price set appropriately**

### 4. Deployment Commands

#### Deploy to BSC Mainnet
```bash
# Install dependencies (including dotenv)
npm install

# Deploy with environment variables
npx hardhat run scripts/deploy.js --network bsc

# Expected output:
# Deploying BAM Swap Contract...
# Network: bsc
# Deploying with account: 0x...
# Account balance: 0.05 BNB
# BAM Swap deployed to: 0x1234567890123456789012345678901234567890
```

#### Verify on BSCScan
```bash
# Automatic verification (uses BSCSCAN_API_KEY from .env)
npx hardhat verify --network bsc <CONTRACT_ADDRESS>

# Expected output:
# Successfully verified contract BAMSwap on Etherscan.
# https://bscscan.com/address/0x1234567890123456789012345678901234567890#code
```

### 5. Deployment Safety Features

#### Pre-deployment Checks
- **Balance Validation**: Ensures minimum 0.01 BNB balance
- **Network Verification**: Confirms correct network (BSC mainnet)
- **Environment Validation**: Checks required environment variables
- **Gas Price Optimization**: Uses efficient gas settings

#### Post-deployment Verification
- **Contract Address**: Generated and displayed
- **Balance Confirmation**: Shows remaining BNB balance
- **Oracle Status**: Confirms Chainlink price feed is active
- **Verification Link**: Direct BSCScan verification command

### 6. Environment Variable Security

#### Best Practices
```bash
# ✅ GOOD - Environment variable
PRIVATE_KEY=abc123def456...

# ❌ BAD - Hardcoded in config
accounts: ["abc123def456..."]

# ✅ GOOD - Protected file
echo ".env" >> .gitignore

# ❌ BAD - Committed to repository
git add .env
```

#### Production Security
- **Never commit .env files**
- **Use hardware wallets when possible**
- **Rotate API keys regularly**
- **Monitor deployment account balance**
- **Use dedicated deployment wallets**

### 7. Gas Optimization

#### Recommended Settings
```bash
# Mainnet (conservative)
GAS_PRICE=5000000000    # 5 gwei
GAS_LIMIT=5000000       # 5M gas

# High traffic (faster confirmation)
GAS_PRICE=10000000000   # 10 gwei
GAS_LIMIT=5000000       # 5M gas
```

#### Cost Estimation
- **Deployment Cost**: ~0.01-0.02 BNB
- **Verification**: Free (requires API key)
- **Buffer Recommended**: 0.05 BNB total balance

### 8. Troubleshooting

#### Common Issues
```bash
# Issue: "PRIVATE_KEY environment variable is required"
# Solution: Ensure .env file exists with PRIVATE_KEY set

# Issue: "Insufficient balance"
# Solution: Add more BNB to deployment wallet

# Issue: "Contract verification failed"
# Solution: Check BSCSCAN_API_KEY is valid

# Issue: "Transaction underpriced"
# Solution: Increase GAS_PRICE in .env
```

## Ready for Secure Deployment ✅

The contract is now configured for secure deployment with environment variable protection.