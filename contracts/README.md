# BAM Swap Smart Contract

A simple, fast, efficient and secure swap contract for the BAM ecosystem on Binance Smart Chain.

## Features

### Core Functionality
- **USDB ↔ USDT Swaps**: 1:1 ratio with no fees
- **BAM Token Purchase**: Fixed price at $0.0000001
- **Multi-currency Support**: Accept USDT and BNB for BAM purchases
- **Real-time Quotes**: Get swap quotes before execution

### Security Features
- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Access Control**: Owner-only administrative functions
- **Emergency Pause**: Pause contract in emergency situations
- **Safe Transfers**: Using SafeERC20 for all token transfers

### Administrative Features
- **Liquidity Management**: Add/remove liquidity for all tokens
- **Price Updates**: Update BNB/USD price oracle
- **Emergency Withdrawals**: Withdraw any stuck tokens or BNB

## Contract Addresses (BSC Mainnet)

```solidity
USDT: 0x55d398326f99059fF775485246999027B3197955
USDB: 0x4050334836d59C1276068e496aB239DC80247675
BAM:  0xA779f03b752fa2442e6A23f145b007f2160F9a7D
```

## Usage Examples

### Swap USDT to USDB
```solidity
// Approve USDT spending first
USDT.approve(bamSwapAddress, amount);

// Execute swap
bamSwap.swapUSDTToUSDB(amount);
```

### Buy BAM with USDT
```solidity
// Approve USDT spending
USDT.approve(bamSwapAddress, usdtAmount);

// Get quote first (optional)
uint256 bamAmount = bamSwap.getUSDTToBAMQuote(usdtAmount);

// Execute purchase
bamSwap.buyBAMWithUSDT(usdtAmount);
```

### Buy BAM with BNB
```solidity
// Get quote first (optional)
uint256 bamAmount = bamSwap.getBNBToBAMQuote(bnbAmount);

// Execute purchase (send BNB with transaction)
bamSwap.buyBAMWithBNB{value: bnbAmount}();
```

## Price Calculation

### BAM Token Price
- **Fixed Price**: $0.0000001 USD per BAM token
- **Price in Wei**: 100 wei = $0.0000001
- **Example**: 1 USDT = 10,000,000 BAM tokens

### BNB Conversion
- Uses internal oracle price (updatable by owner)
- Default: $600 USD per BNB
- Converts BNB → USD → BAM tokens

## Gas Optimization

The contract is optimized for minimal gas usage:
- Efficient price calculations
- Minimal storage reads/writes
- Batch operations where possible
- Constants for fixed values

## Security Considerations

1. **Price Oracle**: BNB price is manually updated by owner
2. **Liquidity Risk**: Contract requires sufficient token liquidity
3. **Access Control**: Only owner can perform administrative functions
4. **Emergency Controls**: Pause functionality for critical situations

## Events

```solidity
event SwapUSDTToUSDB(address indexed user, uint256 amount);
event SwapUSDBToUSDT(address indexed user, uint256 amount);
event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount);
event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount);
event BNBPriceUpdated(uint256 oldPrice, uint256 newPrice);
event EmergencyWithdraw(address indexed token, uint256 amount);
```

## Functions Overview

### User Functions
- `swapUSDTToUSDB(uint256 amount)`: Swap USDT to USDB 1:1
- `swapUSDBToUSDT(uint256 amount)`: Swap USDB to USDT 1:1
- `buyBAMWithUSDT(uint256 usdtAmount)`: Buy BAM tokens with USDT
- `buyBAMWithBNB()`: Buy BAM tokens with BNB (payable)
- `getUSDTToBAMQuote(uint256)`: Get BAM quote for USDT amount
- `getBNBToBAMQuote(uint256)`: Get BAM quote for BNB amount

### View Functions
- `getContractBalances()`: Get all token balances
- `getPriceInfo()`: Get current pricing information
- `calculateBAMFromUSDT(uint256)`: Calculate BAM from USDT
- `calculateBAMFromBNB(uint256)`: Calculate BAM from BNB

### Owner Functions
- `updateBNBPrice(uint256)`: Update BNB/USD price
- `addLiquidity(address, uint256)`: Add token liquidity
- `emergencyWithdraw(address, uint256)`: Emergency token withdrawal
- `pause()`/`unpause()`: Pause/unpause contract

## Deployment

1. Deploy contract with owner address
2. Add initial liquidity for all tokens
3. Set appropriate BNB price
4. Verify contract on BSCScan

## Testing

Comprehensive test suite should include:
- All swap functions
- Price calculations
- Emergency scenarios
- Access controls
- Edge cases and error conditions