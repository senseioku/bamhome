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
 * @dev Simple, fast, efficient and secure swap contract for BAM ecosystem
 * Features:
 * - USDB ↔ USDT swaps at 1:1 ratio
 * - Buy BAM tokens with USDT at fixed $0.0000001 price
 * - Buy BAM tokens with BNB at equivalent $0.0000001 price
 * - Emergency pause functionality
 * - Reentrancy protection
 * - Owner controls for security
 */
contract BAMSwap is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Token contracts on BSC Mainnet
    IERC20 public constant USDT = IERC20(0x55d398326f99059fF775485246999027B3197955);
    IERC20 public constant USDB = IERC20(0x4050334836d59C1276068e496aB239DC80247675);
    IERC20 public constant BAM = IERC20(0xA779f03b752fa2442e6A23f145b007f2160F9a7D);

    // Price configuration
    uint256 public constant BAM_PRICE_IN_USD = 100; // $0.0000001 in wei (100 wei = 0.0000001 USD)
    uint256 public constant PRICE_DECIMALS = 18;
    
    // Chainlink BNB/USD price feed on BSC Mainnet
    AggregatorV3Interface internal bnbPriceFeed;
    
    // Price feed settings
    uint256 public constant PRICE_FEED_DECIMALS = 8; // Chainlink feeds use 8 decimals
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour max price age
    
    // Fallback price (can be updated by owner)
    uint256 public fallbackBnbPrice = 600 * 1e18; // $600 USD per BNB (18 decimals)
    bool public useFallbackPrice = false;
    
    // Events
    event SwapUSDTToUSDB(address indexed user, uint256 amount);
    event SwapUSDBToUSDT(address indexed user, uint256 amount);
    event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount);
    event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount);
    event BNBPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event FallbackPriceToggled(bool enabled);
    event PriceFeedUpdated(address newFeed);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    constructor() Ownable(msg.sender) {
        // Initialize Chainlink BNB/USD price feed for BSC Mainnet
        bnbPriceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);
    }

    /**
     * @dev Swap USDT to USDB at 1:1 ratio
     * @param amount Amount of USDT to swap (18 decimals)
     */
    function swapUSDTToUSDB(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        // Check contract has enough USDB
        require(USDB.balanceOf(address(this)) >= amount, "Insufficient USDB liquidity");
        
        // Transfer USDT from user to contract
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer USDB from contract to user
        USDB.safeTransfer(msg.sender, amount);
        
        emit SwapUSDTToUSDB(msg.sender, amount);
    }

    /**
     * @dev Swap USDB to USDT at 1:1 ratio
     * @param amount Amount of USDB to swap (18 decimals)
     */
    function swapUSDBToUSDT(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        // Check contract has enough USDT
        require(USDT.balanceOf(address(this)) >= amount, "Insufficient USDT liquidity");
        
        // Transfer USDB from user to contract
        USDB.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer USDT from contract to user
        USDT.safeTransfer(msg.sender, amount);
        
        emit SwapUSDBToUSDT(msg.sender, amount);
    }

    /**
     * @dev Buy BAM tokens with USDT at fixed price $0.0000001
     * @param usdtAmount Amount of USDT to spend (18 decimals)
     */
    function buyBAMWithUSDT(uint256 usdtAmount) external nonReentrant whenNotPaused {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        // Calculate BAM tokens to receive
        uint256 bamAmount = calculateBAMFromUSDT(usdtAmount);
        require(bamAmount > 0, "BAM amount too small");
        
        // Check contract has enough BAM tokens
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        // Transfer USDT from user to contract
        USDT.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithUSDT(msg.sender, usdtAmount, bamAmount);
    }

    /**
     * @dev Buy BAM tokens with BNB at equivalent $0.0000001 price
     */
    function buyBAMWithBNB() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "BNB amount must be greater than 0");
        
        // Calculate BAM tokens to receive based on BNB value
        uint256 bamAmount = calculateBAMFromBNB(msg.value);
        require(bamAmount > 0, "BAM amount too small");
        
        // Check contract has enough BAM tokens
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithBNB(msg.sender, msg.value, bamAmount);
    }

    /**
     * @dev Calculate BAM tokens from USDT amount
     * @param usdtAmount Amount of USDT (18 decimals)
     * @return BAM tokens to receive (18 decimals)
     */
    function calculateBAMFromUSDT(uint256 usdtAmount) public pure returns (uint256) {
        // 1 BAM = $0.0000001 = 100 wei
        // bamAmount = usdtAmount / BAM_PRICE_IN_USD
        return (usdtAmount * 1e18) / BAM_PRICE_IN_USD;
    }

    /**
     * @dev Calculate BAM tokens from BNB amount using live price feed
     * @param bnbAmount Amount of BNB in wei
     * @return BAM tokens to receive (18 decimals)
     */
    function calculateBAMFromBNB(uint256 bnbAmount) public view returns (uint256) {
        // Get current BNB price
        uint256 currentBnbPrice = getCurrentBNBPrice();
        
        // Convert BNB to USD value
        uint256 usdValue = (bnbAmount * currentBnbPrice) / 1e18;
        
        // Calculate BAM tokens from USD value
        return calculateBAMFromUSDT(usdValue);
    }

    /**
     * @dev Get current BNB price from Chainlink oracle or fallback
     * @return BNB price in USD (18 decimals)
     */
    function getCurrentBNBPrice() public view returns (uint256) {
        if (useFallbackPrice) {
            return fallbackBnbPrice;
        }

        try bnbPriceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            // Check if price is valid and recent
            require(price > 0, "Invalid price from feed");
            require(updatedAt > 0, "Price feed not updated");
            require(block.timestamp - updatedAt <= MAX_PRICE_AGE, "Price feed too old");
            require(answeredInRound >= roundId, "Stale price data");
            
            // Convert from 8 decimals to 18 decimals
            return uint256(price) * 1e10;
            
        } catch {
            // If price feed fails, use fallback price
            return fallbackBnbPrice;
        }
    }

    /**
     * @dev Get quote for USDT to BAM swap
     * @param usdtAmount Amount of USDT to spend
     * @return bamAmount Amount of BAM tokens to receive
     */
    function getUSDTToBAMQuote(uint256 usdtAmount) external pure returns (uint256 bamAmount) {
        return calculateBAMFromUSDT(usdtAmount);
    }

    /**
     * @dev Get quote for BNB to BAM swap
     * @param bnbAmount Amount of BNB to spend (in wei)
     * @return bamAmount Amount of BAM tokens to receive
     */
    function getBNBToBAMQuote(uint256 bnbAmount) external view returns (uint256 bamAmount) {
        return calculateBAMFromBNB(bnbAmount);
    }

    /**
     * @dev Update fallback BNB price in USD (only owner)
     * @param newPrice New fallback BNB price in USD (18 decimals)
     */
    function updateFallbackBNBPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        uint256 oldPrice = fallbackBnbPrice;
        fallbackBnbPrice = newPrice;
        emit BNBPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Toggle between Chainlink price feed and fallback price (only owner)
     * @param _useFallback Whether to use fallback price instead of oracle
     */
    function toggleFallbackPrice(bool _useFallback) external onlyOwner {
        useFallbackPrice = _useFallback;
        emit FallbackPriceToggled(_useFallback);
    }

    /**
     * @dev Update Chainlink price feed address (only owner)
     * @param newFeed New price feed contract address
     */
    function updatePriceFeed(address newFeed) external onlyOwner {
        require(newFeed != address(0), "Invalid feed address");
        bnbPriceFeed = AggregatorV3Interface(newFeed);
        emit PriceFeedUpdated(newFeed);
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw tokens (only owner)
     * @param token Token address to withdraw (address(0) for BNB)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Withdraw BNB
            require(address(this).balance >= amount, "Insufficient BNB balance");
            payable(owner()).transfer(amount);
        } else {
            // Withdraw ERC20 token
            IERC20(token).safeTransfer(owner(), amount);
        }
        emit EmergencyWithdraw(token, amount);
    }

    /**
     * @dev Add liquidity for tokens (only owner)
     * @param token Token address
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Get contract balances
     * @return usdtBalance USDT balance
     * @return usdbBalance USDB balance  
     * @return bamBalance BAM balance
     * @return bnbBalance BNB balance
     */
    function getContractBalances() external view returns (
        uint256 usdtBalance,
        uint256 usdbBalance,
        uint256 bamBalance,
        uint256 bnbBalance
    ) {
        usdtBalance = USDT.balanceOf(address(this));
        usdbBalance = USDB.balanceOf(address(this));
        bamBalance = BAM.balanceOf(address(this));
        bnbBalance = address(this).balance;
    }

    /**
     * @dev Get current BAM price info and BNB price
     * @return priceInUSD BAM price in USD (wei)
     * @return bnbPrice Current BNB price in USD (18 decimals)
     * @return isUsingFallback Whether fallback price is being used
     * @return priceAge Age of the price data in seconds
     */
    function getPriceInfo() external view returns (
        uint256 priceInUSD, 
        uint256 bnbPrice, 
        bool isUsingFallback,
        uint256 priceAge
    ) {
        priceInUSD = BAM_PRICE_IN_USD;
        bnbPrice = getCurrentBNBPrice();
        isUsingFallback = useFallbackPrice;
        
        // Get price age from oracle
        if (!useFallbackPrice) {
            try bnbPriceFeed.latestRoundData() returns (
                uint80,
                int256,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                priceAge = block.timestamp - updatedAt;
            } catch {
                priceAge = type(uint256).max; // Indicate oracle failure
            }
        } else {
            priceAge = 0; // Fallback price is always "current"
        }
    }

    /**
     * @dev Get detailed price feed information
     * @return feedAddress Address of the current price feed
     * @return feedDecimals Decimals used by the price feed
     * @return maxPriceAge Maximum allowed price age
     * @return fallbackPrice Current fallback price
     */
    function getPriceFeedInfo() external view returns (
        address feedAddress,
        uint8 feedDecimals,
        uint256 maxPriceAge,
        uint256 fallbackPrice
    ) {
        feedAddress = address(bnbPriceFeed);
        feedDecimals = uint8(PRICE_FEED_DECIMALS);
        maxPriceAge = MAX_PRICE_AGE;
        fallbackPrice = fallbackBnbPrice;
    }

    /**
     * @dev Receive BNB function
     */
    receive() external payable {
        // Allow contract to receive BNB
    }
}