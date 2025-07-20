# BAM Swap Contract Deployment Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Hardhat** development environment
3. **BSC wallet** with BNB for gas fees
4. **BSCScan API key** for contract verification

## Installation

```bash
cd contracts
npm install
```

## Configuration

### 1. Environment Setup

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
BNB_PRICE_USD=600000000000000000000  # $600 in wei (18 decimals)
```

### 2. Update hardhat.config.js

Add your private key and API key to the configuration:

```javascript
networks: {
  bsc: {
    url: "https://bsc-dataseed1.binance.org/",
    chainId: 56,
    gasPrice: 20000000000,
    accounts: [process.env.PRIVATE_KEY]
  }
},
etherscan: {
  apiKey: {
    bsc: process.env.BSCSCAN_API_KEY
  }
}
```

## Deployment Steps

### 1. Compile Contracts

```bash
npx hardhat compile
```

### 2. Run Tests (Optional)

```bash
npx hardhat test
```

### 3. Deploy to BSC Mainnet

```bash
npx hardhat run scripts/deploy.js --network bsc
```

### 4. Verify Contract

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS>
```

## Post-Deployment Setup

### 1. Add Initial Liquidity

The contract needs liquidity for all supported tokens:

```javascript
// Example amounts (adjust based on your needs)
const usdtLiquidity = ethers.parseEther("10000");    // 10,000 USDT
const usdbLiquidity = ethers.parseEther("10000");    // 10,000 USDB
const bamLiquidity = ethers.parseEther("1000000000"); // 1B BAM tokens

// Approve tokens first
await usdt.approve(contractAddress, usdtLiquidity);
await usdb.approve(contractAddress, usdbLiquidity);
await bam.approve(contractAddress, bamLiquidity);

// Add liquidity
await bamSwap.addLiquidity(usdtAddress, usdtLiquidity);
await bamSwap.addLiquidity(usdbAddress, usdbLiquidity);
await bamSwap.addLiquidity(bamAddress, bamLiquidity);
```

### 2. Update BNB Price (if needed)

```javascript
const newBnbPrice = ethers.parseEther("650"); // $650 USD
await bamSwap.updateBNBPrice(newBnbPrice);
```

### 3. Test Basic Functions

```javascript
// Test USDT to USDB swap
const swapAmount = ethers.parseEther("100");
await usdt.approve(contractAddress, swapAmount);
await bamSwap.swapUSDTToUSDB(swapAmount);

// Test BAM purchase with USDT
const usdtAmount = ethers.parseEther("1");
await usdt.approve(contractAddress, usdtAmount);
await bamSwap.buyBAMWithUSDT(usdtAmount);

// Test BAM purchase with BNB
const bnbAmount = ethers.parseEther("0.1");
await bamSwap.buyBAMWithBNB({ value: bnbAmount });
```

## Security Checklist

- [ ] Contract deployed with correct owner address
- [ ] All token addresses verified and correct
- [ ] Initial liquidity added safely
- [ ] BNB price set to current market rate
- [ ] Contract verified on BSCScan
- [ ] Emergency pause functionality tested
- [ ] Ownership transfer process documented

## Gas Optimization

### Typical Gas Costs (BSC Mainnet)

- **Deploy Contract**: ~2,500,000 gas (~$15 at 20 gwei)
- **Swap Functions**: ~80,000-120,000 gas (~$0.50-$0.75)
- **Buy BAM Functions**: ~100,000-150,000 gas (~$0.60-$0.90)
- **Admin Functions**: ~50,000-80,000 gas (~$0.30-$0.50)

### Gas Saving Tips

1. Use batch operations when possible
2. Keep contract state minimal
3. Use events for off-chain data
4. Optimize function order and visibility

## Monitoring & Maintenance

### Events to Monitor

- `SwapUSDTToUSDB` / `SwapUSDBToUSDT`: Track swap volumes
- `BuyBAMWithUSDT` / `BuyBAMWithBNB`: Monitor BAM sales
- `BNBPriceUpdated`: Track price updates
- `EmergencyWithdraw`: Monitor admin actions

### Regular Maintenance

1. **Price Updates**: Update BNB price regularly (daily/weekly)
2. **Liquidity Monitoring**: Ensure sufficient token liquidity
3. **Security Audits**: Regular contract security reviews
4. **Gas Optimization**: Monitor and optimize gas usage

## Emergency Procedures

### Contract Issues

1. **Pause Contract**: `bamSwap.pause()`
2. **Emergency Withdrawal**: `bamSwap.emergencyWithdraw(token, amount)`
3. **Price Correction**: `bamSwap.updateBNBPrice(newPrice)`

### Liquidity Issues

1. Add more liquidity: `bamSwap.addLiquidity(token, amount)`
2. Temporary pause until resolved
3. Communicate with users about maintenance

## Contract Addresses

**BSC Mainnet:**
- USDT: `0x55d398326f99059fF775485246999027B3197955`
- USDB: `0x4050334836d59C1276068e496aB239DC80247675`
- BAM: `0xA779f03b752fa2442e6A23f145b007f2160F9a7D`

**BAM Swap Contract:** `[TO_BE_DEPLOYED]`

## Support & Documentation

- **Contract Code**: See `contracts/BAMSwap.sol`
- **Test Suite**: See `test/BAMSwap.test.js`
- **API Documentation**: See `README.md`
- **Security Audit**: [Link to audit report when available]