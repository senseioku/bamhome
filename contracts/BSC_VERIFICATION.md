# BSC Verification Guide for BAM Swap Contract

## Prerequisites for BSCScan Verification

### 1. Setup Environment Variables
Create `.env` file in contracts directory:
```bash
# Copy from example
cp .env.example .env

# Edit with your credentials
PRIVATE_KEY=your_private_key_without_0x_prefix
BSCSCAN_API_KEY=your_bscscan_api_key_here
```

Get BSCScan API Key:
- Visit: https://bscscan.com/apis
- Create account and generate API key

### 2. Deployment Command
```bash
# Deploy to BSC Mainnet
npx hardhat run scripts/deploy.js --network bsc

# Example output:
# BAM Swap deployed to: 0x1234567890123456789012345678901234567890
```

### 3. Verification Command
```bash
# Verify on BSCScan (no constructor parameters needed)
npx hardhat verify --network bsc <CONTRACT_ADDRESS>

# Example:
npx hardhat verify --network bsc 0x1234567890123456789012345678901234567890
```

## Contract Verification Details

### Compiler Settings
- **Solidity Version**: 0.8.20
- **Optimization**: Enabled (200 runs)
- **License**: MIT
- **Constructor Parameters**: None (all addresses hardcoded)

### Source Code Structure
```
BAMSwap.sol (Main Contract)
├── interfaces/
│   └── AggregatorV3Interface.sol
└── OpenZeppelin Dependencies:
    ├── ReentrancyGuard.sol
    ├── Ownable.sol
    ├── Pausable.sol
    ├── IERC20.sol
    └── SafeERC20.sol
```

### Hardcoded Addresses (BSC Mainnet)
- **USDT**: `0x55d398326f99059fF775485246999027B3197955`
- **USDB**: `0x4050334836d59C1276068e496aB239DC80247675`
- **BAM**: `0xA779f03b752fa2442e6A23f145b007f2160F9a7D`
- **BNB/USD Oracle**: `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`
- **Fee Recipient**: `0x65b504C7204FF08C52cAf69eF090A2B0E763C00b`
- **Payment Recipient**: `0xEbF9c1C3F513D8f043a9A6A631ddc72cc1092F71`

## Post-Deployment Verification

### 1. Contract Functions Verification
```bash
# Test each function is accessible
# Check read functions work:
- getContractInfo()
- getPauseStatus()
- getBNBPriceWithValidation()

# Verify owner functions (owner only):
- pause()/unpause()
- Individual pause controls
- Emergency functions
```

### 2. Oracle Integration Check
```bash
# Verify Chainlink price feed works
# Check BNB price is reasonable ($1-$10,000 range)
# Confirm price updates automatically
```

### 3. Fee Structure Verification
```bash
# Confirm constants are correct:
LOW_FEE_RATE = 50 (0.5%)
HIGH_FEE_RATE = 150 (1.5%)
PAYMENT_DISTRIBUTION_RATE = 9000 (90%)
```

## BSCScan Interface

Once verified, users will see on BSCScan:
- ✅ **Read Contract** - All view functions
- ✅ **Write Contract** - All public functions
- ✅ **Events** - Transaction logs
- ✅ **Source Code** - Full contract code
- ✅ **Contract ABI** - For integration

## Security Verification Checklist

### Contract Security
- [x] No private keys in code
- [x] All mainnet addresses verified
- [x] Owner access controls implemented
- [x] Reentrancy protection active
- [x] Pausable functionality working
- [x] Emergency controls available

### Business Logic
- [x] Fee calculations correct (0.5%/1.5%)
- [x] Payment distribution (90/10) implemented
- [x] Token retention for BAM/USDB working
- [x] BAM price fixed at $0.0000001
- [x] Individual pause controls functional

### Oracle Integration
- [x] Chainlink BNB/USD feed active
- [x] Price validation working
- [x] Fallback mechanism ready
- [x] Emergency mode available

## Ready for Production ✅

The contract is fully prepared for BSC mainnet deployment with automatic BSCScan verification.