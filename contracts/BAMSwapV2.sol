// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BAM Swap Contract V2 - Enhanced with Flexible Range Purchases
 * @dev Flexible token swap contract with dynamic pricing and range-based purchases
 * @author BAM Ecosystem Team
 */
contract BAMSwapV2 is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    // Token contracts on BSC Mainnet (same as V1)
    IERC20 public immutable USDT;
    IERC20 public immutable USDB;
    IERC20 public immutable BAM;
    
    // Fee configuration (in basis points: 50 = 0.5%, 150 = 1.5%)
    uint256 public constant LOW_FEE_RATE = 50;   // 0.5% for USDT→BAM, BNB→BAM, USDT→USDB
    uint256 public constant HIGH_FEE_RATE = 150; // 1.5% for BAM→USDT, BAM→BNB, USDB→USDT
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant PAYMENT_DISTRIBUTION_RATE = 9000; // 90% to payment recipient
    
    // Recipients for fees and payments
    address public feeRecipient;
    address public paymentRecipient;
    
    // BAM token pricing (flexible with wide range support)
    uint256 public bamPriceInUSD = 1e12; // Default: $0.000001 per BAM (1M BAM per USDT)
    uint256 public constant MIN_BAM_PRICE = 1e11;  // $0.0000001 minimum
    uint256 public constant MAX_BAM_PRICE = 1e18;  // $1.00 maximum
    
    // Purchase limits (flexible range-based system - MAIN CHANGE FROM V1)
    uint256 public minPurchaseAmount = 2e18;  // Default minimum: 2 USDT (replaces exactPurchaseAmount)
    uint256 public maxPurchaseAmount = 5e18;  // Default maximum: 5 USDT (NEW FEATURE)
    uint256 public maxPurchasePerWallet = 5e18; // Default max per wallet: 5 USDT (updated from 1e18)
    
    // Function pause controls
    bool public swapUSDTToUSDBPaused = false; // ENABLED by default
    bool public swapUSDBToUSDTPaused = false; // ENABLED by default
    bool public buyBAMWithUSDTPaused = false; // ENABLED by default
    bool public buyBAMWithBNBPaused = false;  // ENABLED by default
    bool public sellBAMForUSDTPaused = true;  // PAUSED by default
    bool public sellBAMForBNBPaused = true;   // PAUSED by default
    
    // Wallet purchase tracking for BAM purchases
    mapping(address => uint256) public walletPurchases;
    
    // Chainlink price feed for BNB/USD (BSC Mainnet)
    address public constant BNB_USD_PRICE_FEED = 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE;
    
    // Emergency price system
    uint256 public fallbackBNBPrice = 600e8; // $600 fallback price
    bool public emergencyMode = false;
    bool public useChainlinkPriceFeed = true;
    
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
    event EmergencyModeToggled(bool enabled);
    event SwapFunctionPaused(string functionName, bool paused);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    event BAMPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PurchaseLimitsUpdated(uint256 minAmount, uint256 maxAmount, uint256 maxPerWallet);
    event WalletPurchaseReset(address indexed wallet);
    event MinimumPurchaseEnforced(address indexed user, uint256 amount, string tokenType);
    event MinimumSwapEnforced(address indexed user, uint256 amount, string swapType);

    constructor(
        address _usdt,
        address _usdb, 
        address _bam,
        address _feeRecipient,
        address _paymentRecipient
    ) Ownable(msg.sender) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_usdb != address(0), "Invalid USDB address");
        require(_bam != address(0), "Invalid BAM address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_paymentRecipient != address(0), "Invalid payment recipient");
        
        USDT = IERC20(_usdt);
        USDB = IERC20(_usdb);
        BAM = IERC20(_bam);
        feeRecipient = _feeRecipient;
        paymentRecipient = _paymentRecipient;
        
        // Initialize BAM price at default: $0.000001 per BAM (1M BAM per USDT)
        bamPriceInUSD = 1e12; // $0.000001 per BAM
    }
    
    /**
     * @dev Update BAM token price (flexible range: $0.0000001 to $1.00)
     * @param newPrice New price in wei (18 decimals)
     */
    function updateBAMPrice(uint256 newPrice) external onlyOwner {
        require(newPrice >= MIN_BAM_PRICE, "Price below minimum ($0.0000001)");
        require(newPrice <= MAX_BAM_PRICE, "Price above maximum ($1.00)");
        
        uint256 oldPrice = bamPriceInUSD;
        bamPriceInUSD = newPrice;
        emit BAMPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Update purchase limits with flexible range system
     * @param newMinAmount Minimum purchase amount in wei
     * @param newMaxAmount Maximum single purchase amount in wei  
     * @param newMaxPerWallet Maximum total purchases per wallet in wei
     */
    function updatePurchaseLimits(uint256 newMinAmount, uint256 newMaxAmount, uint256 newMaxPerWallet) external onlyOwner {
        require(newMinAmount > 0, "Min amount must be greater than 0");
        require(newMaxAmount >= newMinAmount, "Max amount must be >= min amount");
        require(newMaxPerWallet >= newMaxAmount, "Max per wallet must be >= max amount");
        require(newMaxPerWallet <= 100e18, "Max per wallet cannot exceed 100 USDT");
        
        minPurchaseAmount = newMinAmount;
        maxPurchaseAmount = newMaxAmount;
        maxPurchasePerWallet = newMaxPerWallet;
        emit PurchaseLimitsUpdated(newMinAmount, newMaxAmount, newMaxPerWallet);
    }
    
    /**
     * @dev Buy BAM tokens with USDT using flexible range system
     * @param usdtAmount Amount of USDT to spend (must be within min-max range)
     */
    function buyBAMWithUSDT(uint256 usdtAmount) external nonReentrant whenNotPaused {
        require(!buyBAMWithUSDTPaused, "Buy BAM with USDT is paused");
        require(usdtAmount >= minPurchaseAmount, "Amount below minimum purchase");
        require(usdtAmount <= maxPurchaseAmount, "Amount above maximum single purchase");
        require(walletPurchases[msg.sender] + usdtAmount <= maxPurchasePerWallet, "Total purchases would exceed wallet limit");
        
        // Track wallet purchases
        walletPurchases[msg.sender] += usdtAmount;
        
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
            USDT.safeTransfer(feeRecipient, fee);
            emit FeeCollected(address(USDT), fee, feeRecipient);
        }
        
        if (paymentToRecipient > 0) {
            USDT.safeTransfer(paymentRecipient, paymentToRecipient);
        }
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithUSDT(msg.sender, usdtAmount, bamAmount, paymentToRecipient, remainingInContract);
        emit PaymentDistributed(address(USDT), usdtAmount, paymentToRecipient, remainingInContract);
        emit MinimumPurchaseEnforced(msg.sender, usdtAmount, "USDT");
    }
    
    /**
     * @dev Buy BAM tokens with BNB using flexible range system
     */
    function buyBAMWithBNB() external payable nonReentrant whenNotPaused {
        require(!buyBAMWithBNBPaused, "Buy BAM with BNB is paused");
        require(msg.value > 0, "BNB amount must be greater than 0");
        
        (uint256 bnbPrice, bool isValidPrice) = getBNBPriceWithValidation();
        require(isValidPrice || !emergencyMode, "Price feed unavailable in emergency mode");
        
        // Calculate USD equivalent and validate against range
        uint256 usdValue = (msg.value * bnbPrice) / 1e18;
        require(usdValue >= minPurchaseAmount, "USD value below minimum purchase");
        require(usdValue <= maxPurchaseAmount, "USD value above maximum single purchase");
        require(walletPurchases[msg.sender] + usdValue <= maxPurchasePerWallet, "Total purchases would exceed wallet limit");
        
        // Track wallet purchases in USD equivalent
        walletPurchases[msg.sender] += usdValue;
        
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
            payable(feeRecipient).transfer(fee);
            emit FeeCollected(address(0), fee, feeRecipient);
        }
        
        if (paymentToRecipient > 0) {
            payable(paymentRecipient).transfer(paymentToRecipient);
        }
        
        // Transfer BAM tokens to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithBNB(msg.sender, msg.value, bamAmount, bnbPrice, paymentToRecipient, remainingInContract);
        emit PaymentDistributed(address(0), msg.value, paymentToRecipient, remainingInContract);
        emit MinimumPurchaseEnforced(msg.sender, usdValue, "BNB");
    }
    
    /**
     * @dev Calculate BAM amount from USDT using current BAM price
     */
    function calculateBAMFromUSDT(uint256 usdtAmount) public view returns (uint256) {
        return (usdtAmount * 1e18) / bamPriceInUSD; // Convert to BAM tokens
    }
    
    /**
     * @dev Calculate BAM amount from BNB using current BAM and BNB prices
     */
    function calculateBAMFromBNB(uint256 bnbAmount, uint256 bnbPrice) public view returns (uint256) {
        uint256 usdValue = (bnbAmount * bnbPrice) / 1e18;
        return calculateBAMFromUSDT(usdValue);
    }
    
    /**
     * @dev Get BNB price with validation from Chainlink or fallback
     */
    function getBNBPriceWithValidation() public view returns (uint256 price, bool isValid) {
        if (useChainlinkPriceFeed && !emergencyMode) {
            try this.getChainlinkBNBPrice() returns (uint256 chainlinkPrice) {
                if (chainlinkPrice > 0 && chainlinkPrice < 10000e8) { // Sanity check: $0 < price < $10,000
                    return (chainlinkPrice, true);
                }
            } catch {}
        }
        
        // Fallback to stored price
        return (fallbackBNBPrice, fallbackBNBPrice > 0);
    }
    
    /**
     * @dev Get BNB price from Chainlink (external call for try/catch)
     */
    function getChainlinkBNBPrice() external view returns (uint256) {
        // This would implement Chainlink price feed logic
        // For now, return fallback price
        return fallbackBNBPrice;
    }
    
    /**
     * @dev Reset wallet purchase tracking for specific address (owner only)
     */
    function resetWalletPurchase(address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        walletPurchases[wallet] = 0;
        emit WalletPurchaseReset(wallet);
    }
    
    /**
     * @dev Reset multiple wallet purchases at once (owner only)
     */
    function resetMultipleWalletPurchases(address[] calldata wallets) external onlyOwner {
        for (uint256 i = 0; i < wallets.length; i++) {
            require(wallets[i] != address(0), "Invalid wallet address");
            walletPurchases[wallets[i]] = 0;
            emit WalletPurchaseReset(wallets[i]);
        }
    }
    
    /**
     * @dev Get current purchase limits and BAM price info
     */
    function getPurchaseInfo() external view returns (
        uint256 minPurchase,
        uint256 maxPurchase, 
        uint256 maxPerWallet,
        uint256 currentBAMPrice,
        uint256 bamPerUSDT
    ) {
        return (
            minPurchaseAmount,
            maxPurchaseAmount,
            maxPurchasePerWallet,
            bamPriceInUSD,
            (1e18 * 1e18) / bamPriceInUSD // BAM tokens per 1 USDT
        );
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
        isUsingFallback = !useChainlinkPriceFeed || emergencyMode;
        isEmergencyMode = emergencyMode;
        isPaused = paused();
    }
    
    /**
     * @dev Swap USDT to USDB with 0.5% fee
     */
    function swapUSDTToUSDB(uint256 amount) external nonReentrant whenNotPaused {
        require(!swapUSDTToUSDBPaused, "USDT to USDB swap is paused");
        require(amount >= 1e18, "Minimum swap: 1 USDT");
        
        // Calculate fee (0.5% of amount)
        uint256 fee = (amount * LOW_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;
        
        require(USDB.balanceOf(address(this)) >= amountAfterFee, "Insufficient USDB liquidity");
        
        // Transfer USDT from user
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to fee recipient if applicable
        if (fee > 0) {
            USDT.safeTransfer(feeRecipient, fee);
            emit FeeCollected(address(USDT), fee, feeRecipient);
        }
        
        // Transfer USDB to user (amount after fee)
        USDB.safeTransfer(msg.sender, amountAfterFee);
        
        emit SwapUSDTToUSDB(msg.sender, amountAfterFee, fee);
        emit MinimumSwapEnforced(msg.sender, amount, "USDT_TO_USDB");
    }
    
    /**
     * @dev Swap USDB to USDT with 1.5% fee
     */
    function swapUSDBToUSDT(uint256 amount) external nonReentrant whenNotPaused {
        require(!swapUSDBToUSDTPaused, "USDB to USDT swap is paused");
        require(amount >= 1e18, "Minimum swap: 1 USDB");
        
        // Calculate fee (1.5% of amount)
        uint256 fee = (amount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = amount - fee;
        
        require(USDT.balanceOf(address(this)) >= amountAfterFee, "Insufficient USDT liquidity");
        
        // Transfer full amount from user
        USDB.safeTransferFrom(msg.sender, address(this), amount);
        
        // USDB payments remain in contract (no distribution to payment recipient)
        // Only transfer fee to fee recipient
        if (fee > 0) {
            USDB.safeTransfer(feeRecipient, fee);
            emit FeeCollected(address(USDB), fee, feeRecipient);
        }
        
        // Transfer USDT to user (amount after fee)
        USDT.safeTransfer(msg.sender, amountAfterFee);
        
        emit SwapUSDBToUSDT(msg.sender, amountAfterFee, fee);
        emit MinimumSwapEnforced(msg.sender, amount, "USDB_TO_USDT");
    }
    
    /**
     * @dev Sell BAM tokens for USDT with 1.5% fee
     */
    function sellBAMForUSDT(uint256 bamAmount) external nonReentrant whenNotPaused {
        require(!sellBAMForUSDTPaused, "Sell BAM for USDT is paused");
        require(bamAmount > 0, "BAM amount must be greater than 0");
        
        uint256 usdtAmount = calculateUSDTFromBAM(bamAmount);
        require(usdtAmount > 0, "USDT amount too small");
        
        // Calculate fee (1.5% of USDT amount)
        uint256 fee = (usdtAmount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = usdtAmount - fee;
        
        require(USDT.balanceOf(address(this)) >= usdtAmount, "Insufficient USDT liquidity");
        
        // Transfer BAM from user
        BAM.safeTransferFrom(msg.sender, address(this), bamAmount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            USDT.safeTransfer(feeRecipient, fee);
            emit FeeCollected(address(USDT), fee, feeRecipient);
        }
        
        // Transfer USDT to user (amount after fee)
        USDT.safeTransfer(msg.sender, amountAfterFee);
        
        emit SellBAMForUSDT(msg.sender, bamAmount, amountAfterFee, fee);
    }
    
    /**
     * @dev Sell BAM tokens for BNB with 1.5% fee
     */
    function sellBAMForBNB(uint256 bamAmount) external nonReentrant whenNotPaused {
        require(!sellBAMForBNBPaused, "Sell BAM for BNB is paused");
        require(bamAmount > 0, "BAM amount must be greater than 0");
        
        (uint256 bnbPrice, bool isValidPrice) = getBNBPriceWithValidation();
        require(isValidPrice || !emergencyMode, "Price feed unavailable in emergency mode");
        
        uint256 bnbAmount = calculateBNBFromBAM(bamAmount, bnbPrice);
        require(bnbAmount > 0, "BNB amount too small");
        
        // Calculate fee (1.5% of BNB amount)
        uint256 fee = (bnbAmount * HIGH_FEE_RATE) / FEE_DENOMINATOR;
        uint256 amountAfterFee = bnbAmount - fee;
        
        require(address(this).balance >= bnbAmount, "Insufficient BNB liquidity");
        
        // Transfer BAM from user
        BAM.safeTransferFrom(msg.sender, address(this), bamAmount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
            emit FeeCollected(address(0), fee, feeRecipient);
        }
        
        // Transfer BNB to user (amount after fee)
        payable(msg.sender).transfer(amountAfterFee);
        
        emit SellBAMForBNB(msg.sender, bamAmount, amountAfterFee, bnbPrice, fee);
    }
    
    /**
     * @dev Calculate USDT amount from BAM using current BAM price
     */
    function calculateUSDTFromBAM(uint256 bamAmount) public view returns (uint256) {
        return (bamAmount * bamPriceInUSD) / 1e18;
    }
    
    /**
     * @dev Calculate BNB amount from BAM using current BAM and BNB prices
     */
    function calculateBNBFromBAM(uint256 bamAmount, uint256 bnbPrice) public view returns (uint256) {
        uint256 usdValue = calculateUSDTFromBAM(bamAmount);
        return (usdValue * 1e18) / bnbPrice;
    }
    
    /**
     * @dev Update fallback BNB price (owner only)
     */
    function updateFallbackBNBPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        require(newPrice < 10000e8, "Price too high (max $10,000)");
        
        uint256 oldPrice = fallbackBNBPrice;
        fallbackBNBPrice = newPrice;
        emit FallbackPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Toggle emergency mode (owner only)
     */
    function toggleEmergencyMode() external onlyOwner {
        emergencyMode = !emergencyMode;
        emit EmergencyModeToggled(emergencyMode);
    }
    
    /**
     * @dev Emergency withdraw function (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @dev Update recipients (owner only)
     */
    function updateRecipients(address newFeeRecipient, address newPaymentRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        require(newPaymentRecipient != address(0), "Invalid payment recipient");
        
        feeRecipient = newFeeRecipient;
        paymentRecipient = newPaymentRecipient;
    }
    
    /**
     * @dev Toggle function pause states
     */
    function toggleFunctionPause(string calldata functionName, bool paused) external onlyOwner {
        if (keccak256(bytes(functionName)) == keccak256(bytes("buyBAMWithUSDT"))) {
            buyBAMWithUSDTPaused = paused;
        } else if (keccak256(bytes(functionName)) == keccak256(bytes("buyBAMWithBNB"))) {
            buyBAMWithBNBPaused = paused;
        }
        // Add other function toggles as needed...
        
        emit SwapFunctionPaused(functionName, paused);
    }
}