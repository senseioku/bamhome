// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/AggregatorV3Interface.sol";

/**
 * @title BAMSwap
 * @dev Enhanced BAM Swap with automatic Chainlink price feeds
 * Features:
 * - USDB ↔ USDT swaps at 1:1 ratio
 * - Buy BAM tokens with USDT at fixed $0.0000001 price
 * - Buy BAM tokens with BNB using live Chainlink price feeds
 * - Automatic price updates with fallback mechanisms
 * - Enhanced security and monitoring features
 */
contract BAMSwap is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Token contracts on BSC Mainnet
    IERC20 public constant USDT = IERC20(0x55d398326f99059fF775485246999027B3197955);
    IERC20 public constant USDB = IERC20(0x4050334836d59C1276068e496aB239DC80247675);
    IERC20 public constant BAM = IERC20(0xA779f03b752fa2442e6A23f145b007f2160F9a7D);

    // Price configuration
    uint256 public constant BAM_PRICE_IN_USD = 100; // $0.0000001 in wei
    uint256 public constant PRICE_DECIMALS = 18;
    
    // Fee configuration
    uint256 public constant SWAP_FEE_RATE = 50; // 0.5% (50 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000; // 100.00%
    uint256 public constant PAYMENT_DISTRIBUTION_RATE = 9000; // 90% (9000 basis points)
    
    // Fee and payment addresses
    address public constant FEE_RECIPIENT = 0x65b504C7204FF08C52cAf69eF090A2B0E763C00b;
    address public constant PAYMENT_RECIPIENT = 0xEbF9c1C3F513D8f043a9A6A631ddc72cc1092F71;
    
    // Chainlink Price Feeds on BSC Mainnet
    AggregatorV3Interface internal bnbPriceFeed;
    
    // Price feed configuration
    uint256 public constant CHAINLINK_DECIMALS = 8;
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour
    uint256 public constant MIN_PRICE = 1e18; // $1 minimum BNB price
    uint256 public constant MAX_PRICE = 10000e18; // $10,000 maximum BNB price
    
    // Fallback and emergency settings
    uint256 public fallbackBnbPrice = 600e18; // $600 fallback price
    bool public useFallbackPrice = false;
    bool public emergencyMode = false;

    // Events
    event SwapUSDTToUSDB(address indexed user, uint256 amount, uint256 fee);
    event SwapUSDBToUSDT(address indexed user, uint256 amount, uint256 fee);
    event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount, uint256 paymentToRecipient, uint256 remainingInContract);
    event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount, uint256 bnbPrice, uint256 paymentToRecipient, uint256 remainingInContract);
    event FeeCollected(address indexed token, uint256 amount, address recipient);
    event PaymentDistributed(address indexed token, uint256 totalAmount, uint256 toRecipient, uint256 remaining);
    event PriceSourceChanged(bool isUsingFallback, uint256 price);
    event FallbackPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PriceFeedUpdated(address oldFeed, address newFeed);
    event EmergencyModeToggled(bool enabled);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    constructor() Ownable(msg.sender) {
        // BSC Mainnet BNB/USD Price Feed
        bnbPriceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);
    }

    /**
     * @dev Swap USDT to USDB at 1:1 ratio with 0.5% fee
     */
    function swapUSDTToUSDB(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate fee (0.5% of amount)
        uint256 fee = (amount * SWAP_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;
        
        require(USDB.balanceOf(address(this)) >= amountAfterFee, "Insufficient USDB liquidity");
        
        // Transfer full amount from user
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            USDT.safeTransfer(FEE_RECIPIENT, fee);
            emit FeeCollected(address(USDT), fee, FEE_RECIPIENT);
        }
        
        // Transfer USDB to user (amount after fee)
        USDB.safeTransfer(msg.sender, amountAfterFee);
        
        emit SwapUSDTToUSDB(msg.sender, amountAfterFee, fee);
    }

    /**
     * @dev Swap USDB to USDT at 1:1 ratio with 0.5% fee
     */
    function swapUSDBToUSDT(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate fee (0.5% of amount)
        uint256 fee = (amount * SWAP_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;
        
        require(USDT.balanceOf(address(this)) >= amountAfterFee, "Insufficient USDT liquidity");
        
        // Transfer full amount from user
        USDB.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            USDB.safeTransfer(FEE_RECIPIENT, fee);
            emit FeeCollected(address(USDB), fee, FEE_RECIPIENT);
        }
        
        // Transfer USDT to user (amount after fee)
        USDT.safeTransfer(msg.sender, amountAfterFee);
        
        emit SwapUSDBToUSDT(msg.sender, amountAfterFee, fee);
    }

    /**
     * @dev Buy BAM tokens with USDT at fixed price
     */
    function buyBAMWithUSDT(uint256 usdtAmount) external nonReentrant whenNotPaused {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        uint256 bamAmount = calculateBAMFromUSDT(usdtAmount);
        require(bamAmount > 0, "BAM amount too small");
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        // Transfer USDT from user
        USDT.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Distribute payment: 90% to recipient, 10% remains in contract
        uint256 paymentToRecipient = (usdtAmount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        uint256 remainingInContract = usdtAmount - paymentToRecipient;
        
        if (paymentToRecipient > 0) {
            USDT.safeTransfer(PAYMENT_RECIPIENT, paymentToRecipient);
        }
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithUSDT(msg.sender, usdtAmount, bamAmount, paymentToRecipient, remainingInContract);
        emit PaymentDistributed(address(USDT), usdtAmount, paymentToRecipient, remainingInContract);
    }

    /**
     * @dev Buy BAM tokens with BNB using live price feed
     */
    function buyBAMWithBNB() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "BNB amount must be greater than 0");
        
        (uint256 bnbPrice, bool isValidPrice) = getBNBPriceWithValidation();
        require(isValidPrice || !emergencyMode, "Price feed unavailable in emergency mode");
        
        uint256 bamAmount = calculateBAMFromBNB(msg.value, bnbPrice);
        require(bamAmount > 0, "BAM amount too small");
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        // Distribute BNB payment: 90% to recipient, 10% remains in contract
        uint256 paymentToRecipient = (msg.value * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        uint256 remainingInContract = msg.value - paymentToRecipient;
        
        if (paymentToRecipient > 0) {
            payable(PAYMENT_RECIPIENT).transfer(paymentToRecipient);
        }
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithBNB(msg.sender, msg.value, bamAmount, bnbPrice, paymentToRecipient, remainingInContract);
        emit PaymentDistributed(address(0), msg.value, paymentToRecipient, remainingInContract);
    }

    /**
     * @dev Get current BNB price with validation
     * @return price Current BNB price in USD (18 decimals)
     * @return isValid Whether the price is from a valid source
     */
    function getBNBPriceWithValidation() public view returns (uint256 price, bool isValid) {
        if (useFallbackPrice || emergencyMode) {
            return (fallbackBnbPrice, true);
        }

        try bnbPriceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            // Validate price data
            if (answer <= 0 || 
                updatedAt == 0 || 
                block.timestamp - updatedAt > MAX_PRICE_AGE ||
                answeredInRound < roundId) {
                return (fallbackBnbPrice, false);
            }
            
            // Convert to 18 decimals and validate range
            uint256 priceInUSD = uint256(answer) * 1e10;
            if (priceInUSD < MIN_PRICE || priceInUSD > MAX_PRICE) {
                return (fallbackBnbPrice, false);
            }
            
            return (priceInUSD, true);
            
        } catch {
            return (fallbackBnbPrice, false);
        }
    }

    /**
     * @dev Calculate BAM tokens from USDT amount
     */
    function calculateBAMFromUSDT(uint256 usdtAmount) public pure returns (uint256) {
        return (usdtAmount * 1e18) / BAM_PRICE_IN_USD;
    }

    /**
     * @dev Calculate BAM tokens from BNB amount with specific price
     */
    function calculateBAMFromBNB(uint256 bnbAmount, uint256 bnbPrice) public pure returns (uint256) {
        uint256 usdValue = (bnbAmount * bnbPrice) / 1e18;
        return calculateBAMFromUSDT(usdValue);
    }

    /**
     * @dev Get quotes for swaps including fees
     */
    function getQuotes(uint256 usdtAmount, uint256 bnbAmount) 
        external 
        view 
        returns (
            uint256 bamFromUSDT,
            uint256 bamFromBNB,
            uint256 currentBNBPrice,
            bool priceIsValid,
            uint256 swapFeeUSDT,
            uint256 swapFeeUSDB,
            uint256 paymentToRecipientUSDT,
            uint256 paymentToRecipientBNB
        ) 
    {
        bamFromUSDT = calculateBAMFromUSDT(usdtAmount);
        
        (uint256 bnbPrice, bool isValid) = getBNBPriceWithValidation();
        bamFromBNB = calculateBAMFromBNB(bnbAmount, bnbPrice);
        currentBNBPrice = bnbPrice;
        priceIsValid = isValid;
        
        // Calculate fees for swaps (0.5%)
        swapFeeUSDT = (usdtAmount * SWAP_FEE_RATE) / FEE_DENOMINATOR;
        swapFeeUSDB = (usdtAmount * SWAP_FEE_RATE) / FEE_DENOMINATOR; // Same rate for USDB swaps
        
        // Calculate payment distributions for purchases (90% to recipient)
        paymentToRecipientUSDT = (usdtAmount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        paymentToRecipientBNB = (bnbAmount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
    }

    /**
     * @dev Calculate swap amounts after fees
     */
    function calculateSwapAmounts(uint256 amount) 
        external 
        pure 
        returns (uint256 fee, uint256 amountAfterFee) 
    {
        fee = (amount * SWAP_FEE_RATE) / FEE_DENOMINATOR;
        amountAfterFee = amount - fee;
    }

    /**
     * @dev Calculate payment distribution for purchases
     */
    function calculatePaymentDistribution(uint256 amount) 
        external 
        pure 
        returns (uint256 toRecipient, uint256 remaining) 
    {
        toRecipient = (amount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        remaining = amount - toRecipient;
    }

    /**
     * @dev Update fallback BNB price (owner only)
     */
    function updateFallbackPrice(uint256 newPrice) external onlyOwner {
        require(newPrice >= MIN_PRICE && newPrice <= MAX_PRICE, "Price out of valid range");
        uint256 oldPrice = fallbackBnbPrice;
        fallbackBnbPrice = newPrice;
        emit FallbackPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Toggle fallback price usage (owner only)
     */
    function toggleFallbackPrice(bool _useFallback) external onlyOwner {
        useFallbackPrice = _useFallback;
        (uint256 currentPrice,) = getBNBPriceWithValidation();
        emit PriceSourceChanged(_useFallback, currentPrice);
    }

    /**
     * @dev Update price feed address (owner only)
     */
    function updatePriceFeed(address newFeed) external onlyOwner {
        require(newFeed != address(0), "Invalid feed address");
        address oldFeed = address(bnbPriceFeed);
        bnbPriceFeed = AggregatorV3Interface(newFeed);
        emit PriceFeedUpdated(oldFeed, newFeed);
    }

    /**
     * @dev Toggle emergency mode (owner only)
     */
    function toggleEmergencyMode(bool _emergencyMode) external onlyOwner {
        emergencyMode = _emergencyMode;
        emit EmergencyModeToggled(_emergencyMode);
    }

    /**
     * @dev Add liquidity (owner only)
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient BNB balance");
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
        emit EmergencyWithdraw(token, amount);
    }

    /**
     * @dev Pause/unpause functions
     */
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @dev Get comprehensive contract information
     */
    function getContractInfo() external view returns (
        uint256 usdtBalance,
        uint256 usdbBalance,
        uint256 bamBalance,
        uint256 bnbBalance,
        uint256 currentBNBPrice,
        bool priceIsValid,
        bool isUsingFallback,
        bool isEmergencyMode,
        bool isPaused
    ) {
        usdtBalance = USDT.balanceOf(address(this));
        usdbBalance = USDB.balanceOf(address(this));
        bamBalance = BAM.balanceOf(address(this));
        bnbBalance = address(this).balance;
        
        (currentBNBPrice, priceIsValid) = getBNBPriceWithValidation();
        isUsingFallback = useFallbackPrice;
        isEmergencyMode = emergencyMode;
        isPaused = paused();
    }

    /**
     * @dev Receive BNB
     */
    receive() external payable {}
}