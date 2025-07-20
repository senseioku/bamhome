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
    event SwapUSDTToUSDB(address indexed user, uint256 amount);
    event SwapUSDBToUSDT(address indexed user, uint256 amount);
    event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount);
    event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount, uint256 bnbPrice);
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
     * @dev Swap USDT to USDB at 1:1 ratio
     */
    function swapUSDTToUSDB(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(USDB.balanceOf(address(this)) >= amount, "Insufficient USDB liquidity");
        
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        USDB.safeTransfer(msg.sender, amount);
        
        emit SwapUSDTToUSDB(msg.sender, amount);
    }

    /**
     * @dev Swap USDB to USDT at 1:1 ratio
     */
    function swapUSDBToUSDT(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(USDT.balanceOf(address(this)) >= amount, "Insufficient USDT liquidity");
        
        USDB.safeTransferFrom(msg.sender, address(this), amount);
        USDT.safeTransfer(msg.sender, amount);
        
        emit SwapUSDBToUSDT(msg.sender, amount);
    }

    /**
     * @dev Buy BAM tokens with USDT at fixed price
     */
    function buyBAMWithUSDT(uint256 usdtAmount) external nonReentrant whenNotPaused {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        uint256 bamAmount = calculateBAMFromUSDT(usdtAmount);
        require(bamAmount > 0, "BAM amount too small");
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        USDT.safeTransferFrom(msg.sender, address(this), usdtAmount);
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithUSDT(msg.sender, usdtAmount, bamAmount);
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
        
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithBNB(msg.sender, msg.value, bamAmount, bnbPrice);
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
     * @dev Get quotes for swaps
     */
    function getQuotes(uint256 usdtAmount, uint256 bnbAmount) 
        external 
        view 
        returns (
            uint256 bamFromUSDT,
            uint256 bamFromBNB,
            uint256 currentBNBPrice,
            bool priceIsValid
        ) 
    {
        bamFromUSDT = calculateBAMFromUSDT(usdtAmount);
        
        (uint256 bnbPrice, bool isValid) = getBNBPriceWithValidation();
        bamFromBNB = calculateBAMFromBNB(bnbAmount, bnbPrice);
        currentBNBPrice = bnbPrice;
        priceIsValid = isValid;
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