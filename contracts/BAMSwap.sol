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

    // Price configuration - BAM token price: $0.0000001 USD
    // This represents 0.0000001 USD = 100 wei (in 18 decimal format)
    uint256 public bamPriceInUSD = 100; // 0.0000001 USD in smallest unit (updatable by owner)
    uint256 public constant PRICE_DECIMALS = 18;
    uint256 public constant USD_DECIMALS = 18; // Both USDT and USDB use 18 decimals on BSC
    uint256 public constant MIN_BAM_PRICE = 50; // Minimum BAM price: $0.00000005
    uint256 public constant MAX_BAM_PRICE = 1000; // Maximum BAM price: $0.000001
    uint256 public constant MIN_PURCHASE_USDT = 1e18; // Minimum purchase: 1 USDT
    uint256 public constant MIN_SWAP_AMOUNT = 1e18; // Minimum swap: 1 USDT/USDB
    
    // Fee configuration
    uint256 public constant LOW_FEE_RATE = 50; // 0.5% (50 basis points) - for USDT→USDB, USDT→BAM, BNB→BAM
    uint256 public constant HIGH_FEE_RATE = 150; // 1.5% (150 basis points) - for USDB→USDT, BAM→USDT, BAM→BNB
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
    
    // Individual pause controls for each swap function
    bool public swapUSDTToUSDBPaused = false;
    bool public swapUSDBToUSDTPaused = false;
    bool public buyBAMWithUSDTPaused = false;
    bool public buyBAMWithBNBPaused = false;
    bool public sellBAMForUSDTPaused = false;
    bool public sellBAMForBNBPaused = false;

    // Events
    event SwapUSDTToUSDB(address indexed user, uint256 amount, uint256 fee);
    event SwapUSDBToUSDT(address indexed user, uint256 amount, uint256 fee);
    event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount, uint256 paymentToRecipient, uint256 remainingInContract);
    event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount, uint256 bnbPrice, uint256 paymentToRecipient, uint256 remainingInContract);
    event SellBAMForUSDT(address indexed user, uint256 bamAmount, uint256 usdtAmount, uint256 fee);
    event SellBAMForBNB(address indexed user, uint256 bamAmount, uint256 bnbAmount, uint256 bnbPrice, uint256 fee);
    event FeeCollected(address indexed token, uint256 amount, address recipient);
    event PaymentDistributed(address indexed token, uint256 totalAmount, uint256 toRecipient, uint256 remaining);
    event PriceSourceChanged(bool isUsingFallback, uint256 price);
    event FallbackPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PriceFeedUpdated(address oldFeed, address newFeed);
    event EmergencyModeToggled(bool enabled);
    event SwapFunctionPaused(string functionName, bool paused);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event BAMPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event MinimumPurchaseEnforced(address indexed user, uint256 amount, string purchaseType);
    event MinimumSwapEnforced(address indexed user, uint256 amount, string swapType);

    constructor() Ownable(msg.sender) {
        // BSC Mainnet BNB/USD Price Feed
        bnbPriceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);
    }

    /**
     * @dev Swap USDT to USDB with 0.5% fee (user receives reduced USDB)
     * Example: 10,000 USDT → 9,950 USDB (50 USDT fee + 9,000 USDT to recipient + 950 USDT stays)
     */
    function swapUSDTToUSDB(uint256 amount) external nonReentrant whenNotPaused {
        require(!swapUSDTToUSDBPaused, "USDT to USDB swap is paused");
        require(amount >= MIN_SWAP_AMOUNT, "Minimum swap is 1 USDT");
        
        // Calculate fee (0.5% of amount)
        uint256 fee = (amount * LOW_FEE_RATE) / FEE_DENOMINATOR;
        // User receives USDB after fee deduction
        uint256 usdbToUser = amount - fee;
        
        // Calculate USDT payment distribution (90% to recipient)
        uint256 paymentToRecipient = (amount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        uint256 remainingInContract = amount - paymentToRecipient - fee;
        
        // Ensure calculations are correct
        require(paymentToRecipient + fee + remainingInContract == amount, "Payment distribution error");
        
        require(USDB.balanceOf(address(this)) >= usdbToUser, "Insufficient USDB liquidity");
        
        // Transfer full USDT amount from user
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        
        // Distribute USDT payment: fee to fee recipient, 90% to payment recipient
        if (fee > 0) {
            USDT.safeTransfer(FEE_RECIPIENT, fee);
            emit FeeCollected(address(USDT), fee, FEE_RECIPIENT);
        }
        
        if (paymentToRecipient > 0) {
            USDT.safeTransfer(PAYMENT_RECIPIENT, paymentToRecipient);
        }
        
        // Transfer USDB to user (amount after fee deduction)
        USDB.safeTransfer(msg.sender, usdbToUser);
        
        emit SwapUSDTToUSDB(msg.sender, usdbToUser, fee);
        emit PaymentDistributed(address(USDT), amount, paymentToRecipient, remainingInContract);
        emit MinimumSwapEnforced(msg.sender, amount, "USDT_TO_USDB");
    }

    /**
     * @dev Swap USDB to USDT at 1:1 ratio with 1.5% fee
     * USDB payments remain in contract, no distribution
     */
    function swapUSDBToUSDT(uint256 amount) external nonReentrant whenNotPaused {
        require(!swapUSDBToUSDTPaused, "USDB to USDT swap is paused");
        require(amount >= MIN_SWAP_AMOUNT, "Minimum swap is 1 USDB");
        
        // Calculate fee (1.5% of amount)
        uint256 fee = (amount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;
        
        require(USDT.balanceOf(address(this)) >= amountAfterFee, "Insufficient USDT liquidity");
        
        // Transfer full amount from user
        USDB.safeTransferFrom(msg.sender, address(this), amount);
        
        // USDB payments remain in contract (no distribution to payment recipient)
        // Only transfer fee to fee recipient
        if (fee > 0) {
            USDB.safeTransfer(FEE_RECIPIENT, fee);
            emit FeeCollected(address(USDB), fee, FEE_RECIPIENT);
        }
        
        // Transfer USDT to user (amount after fee)
        USDT.safeTransfer(msg.sender, amountAfterFee);
        
        emit SwapUSDBToUSDT(msg.sender, amountAfterFee, fee);
        emit MinimumSwapEnforced(msg.sender, amount, "USDB_TO_USDT");
    }

    /**
     * @dev Buy BAM tokens with USDT at fixed price with 0.5% fee
     * USDT payment distribution: 90% to recipient, fee to fee recipient, remainder stays in contract
     */
    function buyBAMWithUSDT(uint256 usdtAmount) external nonReentrant whenNotPaused {
        require(!buyBAMWithUSDTPaused, "Buy BAM with USDT is paused");
        require(usdtAmount >= MIN_PURCHASE_USDT, "Minimum purchase is 1 USDT");
        
        // Calculate fee (0.5% of amount)
        uint256 fee = (usdtAmount * LOW_FEE_RATE) / FEE_DENOMINATOR;
        
        uint256 bamAmount = calculateBAMFromUSDT(usdtAmount);
        require(bamAmount > 0, "BAM amount too small");
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        // Transfer USDT from user
        USDT.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Distribute USDT payment: fee to fee recipient, 90% to payment recipient
        uint256 paymentToRecipient = (usdtAmount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        uint256 remainingInContract = usdtAmount - paymentToRecipient - fee;
        
        // Ensure calculations are correct
        require(paymentToRecipient + fee + remainingInContract == usdtAmount, "Payment distribution error");
        
        if (fee > 0) {
            USDT.safeTransfer(FEE_RECIPIENT, fee);
            emit FeeCollected(address(USDT), fee, FEE_RECIPIENT);
        }
        
        if (paymentToRecipient > 0) {
            USDT.safeTransfer(PAYMENT_RECIPIENT, paymentToRecipient);
        }
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithUSDT(msg.sender, usdtAmount, bamAmount, paymentToRecipient, remainingInContract);
        emit PaymentDistributed(address(USDT), usdtAmount, paymentToRecipient, remainingInContract);
        emit MinimumPurchaseEnforced(msg.sender, usdtAmount, "USDT");
    }

    /**
     * @dev Buy BAM tokens with BNB using live price feed with 0.5% fee
     * BNB payment distribution: 90% to recipient, fee to fee recipient, remainder stays in contract
     */
    function buyBAMWithBNB() external payable nonReentrant whenNotPaused {
        require(!buyBAMWithBNBPaused, "Buy BAM with BNB is paused");
        require(msg.value > 0, "BNB amount must be greater than 0");
        
        (uint256 bnbPrice, bool isValidPrice) = getBNBPriceWithValidation();
        require(isValidPrice || !emergencyMode, "Price feed unavailable in emergency mode");
        
        // Check minimum purchase requirement (equivalent to 1 USDT)
        uint256 usdValue = (msg.value * bnbPrice) / 1e18;
        require(usdValue >= MIN_PURCHASE_USDT, "Minimum purchase is 1 USDT equivalent");
        
        // Calculate fee (0.5% of amount)
        uint256 fee = (msg.value * LOW_FEE_RATE) / FEE_DENOMINATOR;
        
        uint256 bamAmount = calculateBAMFromBNB(msg.value, bnbPrice);
        require(bamAmount > 0, "BAM amount too small");
        require(BAM.balanceOf(address(this)) >= bamAmount, "Insufficient BAM liquidity");
        
        // Distribute BNB payment: fee to fee recipient, 90% to payment recipient
        uint256 paymentToRecipient = (msg.value * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        uint256 remainingInContract = msg.value - paymentToRecipient - fee;
        
        // Ensure calculations are correct
        require(paymentToRecipient + fee + remainingInContract == msg.value, "Payment distribution error");
        
        if (fee > 0) {
            payable(FEE_RECIPIENT).transfer(fee);
            emit FeeCollected(address(0), fee, FEE_RECIPIENT);
        }
        
        if (paymentToRecipient > 0) {
            payable(PAYMENT_RECIPIENT).transfer(paymentToRecipient);
        }
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithBNB(msg.sender, msg.value, bamAmount, bnbPrice, paymentToRecipient, remainingInContract);
        emit PaymentDistributed(address(0), msg.value, paymentToRecipient, remainingInContract);
        emit MinimumPurchaseEnforced(msg.sender, usdValue, "BNB");
    }

    /**
     * @dev Sell BAM tokens for USDT with 1.5% fee
     * BAM payments remain in contract, no distribution
     */
    function sellBAMForUSDT(uint256 bamAmount) external nonReentrant whenNotPaused {
        require(!sellBAMForUSDTPaused, "Sell BAM for USDT is paused");
        require(bamAmount > 0, "Amount must be greater than 0");
        
        // Calculate USDT equivalent
        uint256 usdtAmount = calculateUSDTFromBAM(bamAmount);
        require(usdtAmount > 0, "USDT amount too small");
        
        // Calculate fee (1.5% of USDT amount)
        uint256 fee = (usdtAmount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
        uint256 usdtAfterFee = usdtAmount - fee;
        
        require(USDT.balanceOf(address(this)) >= usdtAmount, "Insufficient USDT liquidity");
        
        // Transfer BAM from user
        BAM.safeTransferFrom(msg.sender, address(this), bamAmount);
        
        // BAM payments remain in contract (no distribution to payment recipient)
        // Only transfer fee to fee recipient
        if (fee > 0) {
            USDT.safeTransfer(FEE_RECIPIENT, fee);
            emit FeeCollected(address(USDT), fee, FEE_RECIPIENT);
        }
        
        // Transfer USDT to user (amount after fee)
        USDT.safeTransfer(msg.sender, usdtAfterFee);
        
        emit SellBAMForUSDT(msg.sender, bamAmount, usdtAfterFee, fee);
    }

    /**
     * @dev Sell BAM tokens for BNB with 1.5% fee
     * BAM payments remain in contract, no distribution
     */
    function sellBAMForBNB(uint256 bamAmount) external nonReentrant whenNotPaused {
        require(!sellBAMForBNBPaused, "Sell BAM for BNB is paused");
        require(bamAmount > 0, "Amount must be greater than 0");
        
        (uint256 bnbPrice, bool isValidPrice) = getBNBPriceWithValidation();
        require(isValidPrice || !emergencyMode, "Price feed unavailable in emergency mode");
        
        // Calculate BNB equivalent
        uint256 bnbAmount = calculateBNBFromBAM(bamAmount, bnbPrice);
        require(bnbAmount > 0, "BNB amount too small");
        
        // Calculate fee (1.5% of BNB amount)
        uint256 fee = (bnbAmount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
        uint256 bnbAfterFee = bnbAmount - fee;
        
        require(address(this).balance >= bnbAmount, "Insufficient BNB liquidity");
        
        // Transfer BAM from user
        BAM.safeTransferFrom(msg.sender, address(this), bamAmount);
        
        // BAM payments remain in contract (no distribution to payment recipient)
        // Only transfer fee to fee recipient in BNB
        if (fee > 0) {
            payable(FEE_RECIPIENT).transfer(fee);
            emit FeeCollected(address(0), fee, FEE_RECIPIENT);
        }
        
        // Transfer remaining BNB to user (amount after fee)
        payable(msg.sender).transfer(bnbAfterFee);
        
        emit SellBAMForBNB(msg.sender, bamAmount, bnbAfterFee, bnbPrice, fee);
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
            uint256 /* startedAt */,
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
     * BAM price = $0.0000001, so 1 USDT = 10,000,000 BAM tokens
     */
    function calculateBAMFromUSDT(uint256 usdtAmount) public view returns (uint256) {
        // FIXED: Correct BAM calculation for $0.0000001 per BAM
        // If BAM costs $0.0000001, then 1 USDT ($1.00) buys 10,000,000 BAM tokens
        // bamPriceInUSD = 100 represents 0.0000001 USD in our system
        // Formula: usdtAmount * (1e18 / bamPriceInUSD) = BAM tokens in wei
        return (usdtAmount * 1e18) / (bamPriceInUSD * 1e12);
    }

    /**
     * @dev Calculate BAM tokens from BNB amount with specific price
     */
    function calculateBAMFromBNB(uint256 bnbAmount, uint256 bnbPrice) public view returns (uint256) {
        // Convert BNB to USD value: bnbAmount (18 decimals) * bnbPrice (18 decimals) / 1e18
        uint256 usdValue = (bnbAmount * bnbPrice) / 1e18;
        // Convert USD to BAM tokens using current BAM price - FIXED
        return (usdValue * 1e18) / (bamPriceInUSD * 1e12);
    }

    /**
     * @dev Calculate USDT amount from BAM tokens
     * BAM price = $0.0000001, so 10,000,000 BAM tokens = 1 USDT
     */
    function calculateUSDTFromBAM(uint256 bamAmount) public view returns (uint256) {
        // bamAmount * current BAM price / 1e18 to get USDT amount in 18 decimals
        return (bamAmount * bamPriceInUSD) / 1e18;
    }

    /**
     * @dev Calculate BNB amount from BAM tokens
     */
    function calculateBNBFromBAM(uint256 bamAmount, uint256 bnbPrice) public view returns (uint256) {
        // Convert BAM to USD value using current BAM price
        uint256 usdValue = (bamAmount * bamPriceInUSD) / 1e18;
        // Convert USD to BNB using provided BNB price
        return (usdValue * 1e18) / bnbPrice;
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
        
        // Calculate fees for swaps (0.5% for USDT→USDB, 1.5% for USDB→USDT)
        swapFeeUSDT = (usdtAmount * LOW_FEE_RATE) / FEE_DENOMINATOR; // USDT→USDB: 0.5%
        swapFeeUSDB = (usdtAmount * HIGH_FEE_RATE) / FEE_DENOMINATOR; // USDB→USDT: 1.5%
        
        // Calculate payment distributions for purchases (90% to recipient)
        paymentToRecipientUSDT = (usdtAmount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
        paymentToRecipientBNB = (bnbAmount * PAYMENT_DISTRIBUTION_RATE) / FEE_DENOMINATOR;
    }

    /**
     * @dev Calculate swap amounts after fees for USDT→USDB (0.5%)
     */
    function calculateUSDTToUSDBSwapAmounts(uint256 amount) 
        external 
        pure 
        returns (uint256 fee, uint256 amountAfterFee) 
    {
        fee = (amount * LOW_FEE_RATE) / FEE_DENOMINATOR;
        amountAfterFee = amount - fee;
    }
    
    /**
     * @dev Calculate swap amounts after fees for USDB→USDT (1.5%)
     */
    function calculateUSDBToUSDTSwapAmounts(uint256 amount) 
        external 
        pure 
        returns (uint256 fee, uint256 amountAfterFee) 
    {
        fee = (amount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
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
     * @dev Update BAM token price (owner only)
     * @param newPrice New BAM price in smallest unit (current: 100 = $0.0000001)
     */
    function updateBAMPrice(uint256 newPrice) external onlyOwner {
        require(newPrice >= MIN_BAM_PRICE && newPrice <= MAX_BAM_PRICE, "BAM price out of valid range");
        require(newPrice != bamPriceInUSD, "Price already set to this value");
        uint256 oldPrice = bamPriceInUSD;
        bamPriceInUSD = newPrice;
        emit BAMPriceUpdated(oldPrice, newPrice);
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
     * @dev Individual pause controls for each swap function
     */
    function pauseSwapUSDTToUSDB(bool _paused) external onlyOwner {
        swapUSDTToUSDBPaused = _paused;
        emit SwapFunctionPaused("swapUSDTToUSDB", _paused);
    }
    
    function pauseSwapUSDBToUSDT(bool _paused) external onlyOwner {
        swapUSDBToUSDTPaused = _paused;
        emit SwapFunctionPaused("swapUSDBToUSDT", _paused);
    }
    
    function pauseBuyBAMWithUSDT(bool _paused) external onlyOwner {
        buyBAMWithUSDTPaused = _paused;
        emit SwapFunctionPaused("buyBAMWithUSDT", _paused);
    }
    
    function pauseBuyBAMWithBNB(bool _paused) external onlyOwner {
        buyBAMWithBNBPaused = _paused;
        emit SwapFunctionPaused("buyBAMWithBNB", _paused);
    }
    
    function pauseSellBAMForUSDT(bool _paused) external onlyOwner {
        sellBAMForUSDTPaused = _paused;
        emit SwapFunctionPaused("sellBAMForUSDT", _paused);
    }
    
    function pauseSellBAMForBNB(bool _paused) external onlyOwner {
        sellBAMForBNBPaused = _paused;
        emit SwapFunctionPaused("sellBAMForBNB", _paused);
    }
    
    /**
     * @dev Get pause status for all swap functions
     */
    function getPauseStatus() external view returns (
        bool usdtToUsdb,
        bool usdbToUsdt,
        bool buyWithUsdt,
        bool buyWithBnb,
        bool sellForUsdt,
        bool sellForBnb,
        bool globalPause
    ) {
        return (
            swapUSDTToUSDBPaused,
            swapUSDBToUSDTPaused,
            buyBAMWithUSDTPaused,
            buyBAMWithBNBPaused,
            sellBAMForUSDTPaused,
            sellBAMForBNBPaused,
            paused()
        );
    }

    /**
     * @dev Get current BAM price
     */
    function getBAMPrice() external view returns (uint256) {
        return bamPriceInUSD;
    }
    
    /**
     * @dev Get minimum purchase amount
     */
    function getMinimumPurchase() external pure returns (uint256) {
        return MIN_PURCHASE_USDT;
    }
    
    /**
     * @dev Get minimum swap amount
     */
    function getMinimumSwap() external pure returns (uint256) {
        return MIN_SWAP_AMOUNT;
    }

    /**
     * @dev Get comprehensive contract information
     */
    function getContractInfo() external view returns (
        uint256 usdtBalance,
        uint256 usdbBalance,
        uint256 bamBalance,
        uint256 bnbBalance,
        uint256 currentBNBPrice,
        uint256 currentBAMPrice,
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
        currentBAMPrice = bamPriceInUSD;
        isUsingFallback = useFallbackPrice;
        isEmergencyMode = emergencyMode;
        isPaused = paused();
    }

    /**
     * @dev Receive BNB
     */
    receive() external payable {}
}