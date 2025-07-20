# BAM Swap Smart Contract

A simple, fast, efficient and secure swap contract for the BAM ecosystem on Binance Smart Chain.

## Features

### Core Functionality
- **USDB ↔ USDT Swaps**: 1:1 ratio with no fees
- **BAM Token Purchase**: Fixed price at $0.0000001
- **Multi-currency Support**: Accept USDT and BNB for BAM purchases
- **Real-time Quotes**: Get swap quotes before execution
- **Live Price Feeds**: Automatic BNB price updates via Chainlink oracles

### Price Oracle Features
- **Chainlink Integration**: Real-time BNB/USD price feeds from Chainlink
- **Price Validation**: Comprehensive price data validation and freshness checks
- **Fallback Mechanism**: Automatic fallback to manual price if oracle fails
- **Price Range Limits**: Configurable min/max price bounds for safety
- **Emergency Mode**: Manual override for critical situations

### Security Features
- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Access Control**: Owner-only administrative functions
- **Emergency Pause**: Pause contract in emergency situations
- **Safe Transfers**: Using SafeERC20 for all token transfers
- **Oracle Security**: Multiple validation layers for price feed data

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
- **Chainlink Oracle**: Automatic real-time BNB/USD price fetching
- **Price Validation**: Multiple validation layers for data integrity
- **Fallback System**: Automatic fallback if oracle fails
- **Default Fallback**: $600 USD per BNB
- **Process**: BNB → Live USD Price → BAM tokens



## Gas Optimization

The contract is optimized for minimal gas usage:
- Efficient price calculations
- Minimal storage reads/writes
- Batch operations where possible
- Constants for fixed values

## Security Considerations

1. **Chainlink Oracle**: Automatic BNB price feeds with comprehensive validation
2. **Price Validation**: Multiple checks for data freshness and validity
3. **Fallback System**: Automatic fallback to manual price if oracle fails
4. **Liquidity Risk**: Contract requires sufficient token liquidity
5. **Access Control**: Only owner can perform administrative functions
6. **Emergency Controls**: Pause functionality and emergency mode for critical situations

## Events

```solidity
event SwapUSDTToUSDB(address indexed user, uint256 amount);
event SwapUSDBToUSDT(address indexed user, uint256 amount);
event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount);
event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount, uint256 bnbPrice);
event PriceSourceChanged(bool isUsingFallback, uint256 price);
event FallbackPriceUpdated(uint256 oldPrice, uint256 newPrice);
event PriceFeedUpdated(address oldFeed, address newFeed);
event EmergencyModeToggled(bool enabled);
event EmergencyWithdraw(address indexed token, uint256 amount);
```

## Functions Overview

### User Functions
- `swapUSDTToUSDB(uint256 amount)`: Swap USDT to USDB 1:1
- `swapUSDBToUSDT(uint256 amount)`: Swap USDB to USDT 1:1
- `buyBAMWithUSDT(uint256 usdtAmount)`: Buy BAM tokens with USDT
- `buyBAMWithBNB()`: Buy BAM tokens with BNB (payable)
- `getQuotes(uint256, uint256)`: Get quotes for USDT and BNB amounts

### View Functions
- `getBNBPriceWithValidation()`: Get BNB price with validity check
- `getContractInfo()`: Get comprehensive contract information
- `calculateBAMFromUSDT(uint256)`: Calculate BAM from USDT
- `calculateBAMFromBNB(uint256, uint256)`: Calculate BAM from BNB with price

### Owner Functions
- `updateFallbackPrice(uint256)`: Update fallback BNB price
- `toggleFallbackPrice(bool)`: Switch between oracle and fallback
- `updatePriceFeed(address)`: Update Chainlink oracle address
- `toggleEmergencyMode(bool)`: Enable/disable emergency mode
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