// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Chainlink Aggregator V3 Interface
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

/**
 * @title BAMSwapV3 - Complete DeFi Platform
 * @dev Enhanced version with ALL V1 functions + flexible 2-5 USDT purchase range
 * @author BAM Ecosystem Team
 */
contract BAMSwapV3 is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Token contracts
    IERC20 public immutable USDT;
    IERC20 public immutable USDB;
    IERC20 public immutable BAM;
    
    // Recipients
    address public feeRecipient;
    address public paymentRecipient;
    
    // Chainlink price feed
    AggregatorV3Interface public priceFeed;
    bool public useFallbackPrice;
    uint256 public fallbackBnbPrice; // In USD with 8 decimals
    
    // BAM token pricing (in USD with 12 decimals precision)
    uint256 public bamPriceInUSD = 1e12; // Default $0.000001 per BAM
    uint256 public constant MIN_BAM_PRICE = 1e8;  // $0.0000001 minimum
    uint256 public constant MAX_BAM_PRICE = 1e18; // $1.00 maximum
    
    // Purchase limits (in USDT with 18 decimals)
    uint256 public minPurchaseLimit = 2 ether; // 2 USDT minimum
    uint256 public maxPurchaseLimit = 5 ether; // 5 USDT maximum
    uint256 public maxPurchasePerWallet = 5 ether; // 5 USDT max per wallet
    
    // Wallet purchase tracking
    mapping(address => uint256) public walletPurchases;
    
    // Individual function pause controls
    mapping(bytes4 => bool) public functionPaused;
    
    // Events
    event BuyBAMWithUSDT(address indexed user, uint256 usdtAmount, uint256 bamAmount, uint256 fee);
    event BuyBAMWithBNB(address indexed user, uint256 bnbAmount, uint256 bamAmount, uint256 bnbPrice, uint256 fee);
    event SellBAMForUSDT(address indexed user, uint256 bamAmount, uint256 usdtAmount, uint256 fee);
    event SellBAMForBNB(address indexed user, uint256 bamAmount, uint256 bnbAmount, uint256 bnbPrice, uint256 fee);
    event SwapUSDTToUSDB(address indexed user, uint256 usdtAmount, uint256 usdbAmount, uint256 fee);
    event SwapUSDBToUSDT(address indexed user, uint256 usdbAmount, uint256 usdtAmount, uint256 fee);
    event LiquidityAdded(address indexed user, address indexed token, uint256 amount);
    event BAMPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PurchaseLimitsUpdated(uint256 minAmount, uint256 maxAmount, uint256 maxPerWallet);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event PaymentRecipientUpdated(address oldRecipient, address newRecipient);
    event PriceFeedUpdated(address oldFeed, address newFeed);
    event PriceSourceChanged(bool isUsingFallback, uint256 price);
    event FunctionPauseToggled(bytes4 indexed functionSelector, bool isPaused);
    event WalletPurchaseReset(address indexed wallet, uint256 previousAmount);
    event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed recipient);

    constructor(
        address _usdt,
        address _usdb,
        address _bam,
        address _feeRecipient,
        address _paymentRecipient
    ) {
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
        
        // Set BSC Mainnet BNB/USD Chainlink price feed
        priceFeed = AggregatorV3Interface(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);
        fallbackBnbPrice = 60000000000; // $600 with 8 decimals
        useFallbackPrice = false;
        
        // Initialize function pause states (all enabled by default for V3)
        // Individual functions can be paused as needed
    }

    // ==================== MODIFIERS ====================
    
    modifier whenFunctionNotPaused(bytes4 functionSelector) {
        require(!functionPaused[functionSelector], "Function is paused");
        _;
    }
    
    modifier validPurchaseAmount(uint256 amount) {
        require(amount >= minPurchaseLimit, "Amount below minimum");
        require(amount <= maxPurchaseLimit, "Amount above maximum");
        _;
    }
    
    modifier walletPurchaseLimit(uint256 amount) {
        require(
            walletPurchases[msg.sender] + amount <= maxPurchasePerWallet,
            "Exceeds wallet purchase limit"
        );
        _;
    }

    // ==================== CORE PURCHASE FUNCTIONS ====================
    
    /**
     * @dev Buy BAM tokens with USDT (2-5 USDT flexible range)
     */
    function buyBAMWithUSDT(uint256 usdtAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        whenFunctionNotPaused(this.buyBAMWithUSDT.selector)
        validPurchaseAmount(usdtAmount)
        walletPurchaseLimit(usdtAmount)
    {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        // Calculate BAM amount (bamPriceInUSD has 12 decimals, so divide by 1e12)
        uint256 bamAmount = (usdtAmount * 1e12) / bamPriceInUSD;
        
        // Calculate fee (0.5% for buying BAM)
        uint256 fee = (usdtAmount * 50) / 10000; // 0.5%
        uint256 netAmount = usdtAmount - fee;
        
        // Update wallet purchase tracking
        walletPurchases[msg.sender] += usdtAmount;
        
        // Transfer USDT from user
        USDT.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            USDT.safeTransfer(feeRecipient, fee);
        }
        
        // Transfer net payment to payment recipient
        USDT.safeTransfer(paymentRecipient, netAmount);
        
        // Transfer BAM to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithUSDT(msg.sender, usdtAmount, bamAmount, fee);
    }
    
    /**
     * @dev Buy BAM tokens with BNB (2-5 USD equivalent flexible range)
     */
    function buyBAMWithBNB() 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        whenFunctionNotPaused(this.buyBAMWithBNB.selector)
    {
        require(msg.value > 0, "Must send BNB");
        
        uint256 bnbPrice = getBNBPrice();
        uint256 usdValue = (msg.value * bnbPrice) / 1e18; // Convert to USD
        
        require(usdValue >= minPurchaseLimit, "USD value below minimum");
        require(usdValue <= maxPurchaseLimit, "USD value above maximum");
        require(
            walletPurchases[msg.sender] + usdValue <= maxPurchasePerWallet,
            "Exceeds wallet purchase limit"
        );
        
        // Calculate BAM amount
        uint256 bamAmount = (usdValue * 1e12) / bamPriceInUSD;
        
        // Calculate fee (0.5% for buying BAM)
        uint256 fee = (msg.value * 50) / 10000; // 0.5%
        uint256 netAmount = msg.value - fee;
        
        // Update wallet purchase tracking (use USD value)
        walletPurchases[msg.sender] += usdValue;
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }
        
        // Transfer net payment to payment recipient
        payable(paymentRecipient).transfer(netAmount);
        
        // Transfer BAM to user
        BAM.safeTransfer(msg.sender, bamAmount);
        
        emit BuyBAMWithBNB(msg.sender, msg.value, bamAmount, bnbPrice, fee);
    }

    // ==================== SELLING FUNCTIONS ====================
    
    /**
     * @dev Sell BAM tokens for USDT
     */
    function sellBAMForUSDT(uint256 bamAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        whenFunctionNotPaused(this.sellBAMForUSDT.selector)
    {
        require(bamAmount > 0, "Amount must be greater than 0");
        
        // Calculate USDT amount
        uint256 usdtAmount = (bamAmount * bamPriceInUSD) / 1e12;
        
        // Calculate fee (1.5% for selling BAM)
        uint256 fee = (usdtAmount * 150) / 10000; // 1.5%
        uint256 netAmount = usdtAmount - fee;
        
        // Transfer BAM from user
        BAM.safeTransferFrom(msg.sender, address(this), bamAmount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            USDT.safeTransfer(feeRecipient, fee);
        }
        
        // Transfer net USDT to user
        USDT.safeTransfer(msg.sender, netAmount);
        
        emit SellBAMForUSDT(msg.sender, bamAmount, usdtAmount, fee);
    }
    
    /**
     * @dev Sell BAM tokens for BNB
     */
    function sellBAMForBNB(uint256 bamAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        whenFunctionNotPaused(this.sellBAMForBNB.selector)
    {
        require(bamAmount > 0, "Amount must be greater than 0");
        
        uint256 bnbPrice = getBNBPrice();
        
        // Calculate USDT value first, then convert to BNB
        uint256 usdtValue = (bamAmount * bamPriceInUSD) / 1e12;
        uint256 bnbAmount = (usdtValue * 1e18) / bnbPrice;
        
        // Calculate fee (1.5% for selling BAM)
        uint256 fee = (bnbAmount * 150) / 10000; // 1.5%
        uint256 netAmount = bnbAmount - fee;
        
        // Transfer BAM from user
        BAM.safeTransferFrom(msg.sender, address(this), bamAmount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }
        
        // Transfer net BNB to user
        payable(msg.sender).transfer(netAmount);
        
        emit SellBAMForBNB(msg.sender, bamAmount, bnbAmount, bnbPrice, fee);
    }

    // ==================== SWAP FUNCTIONS ====================
    
    /**
     * @dev Swap USDT for USDB
     */
    function swapUSDTToUSDB(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        whenFunctionNotPaused(this.swapUSDTToUSDB.selector)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(amount >= 1 ether, "Minimum 1 USDT required");
        
        // Calculate fee (0.5% for USDT to USDB)
        uint256 fee = (amount * 50) / 10000; // 0.5%
        uint256 usdbAmount = amount - fee;
        
        // Transfer USDT from user
        USDT.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            USDT.safeTransfer(feeRecipient, fee);
        }
        
        // Transfer USDB to user (1:1 ratio minus fee)
        USDB.safeTransfer(msg.sender, usdbAmount);
        
        emit SwapUSDTToUSDB(msg.sender, amount, usdbAmount, fee);
    }
    
    /**
     * @dev Swap USDB for USDT
     */
    function swapUSDBToUSDT(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        whenFunctionNotPaused(this.swapUSDBToUSDT.selector)
    {
        require(amount > 0, "Amount must be greater than 0");
        require(amount >= 1 ether, "Minimum 1 USDB required");
        
        // Calculate fee (1.5% for USDB to USDT)
        uint256 fee = (amount * 150) / 10000; // 1.5%
        uint256 usdtAmount = amount - fee;
        
        // Transfer USDB from user
        USDB.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to fee recipient (keep as USDB)
        if (fee > 0) {
            USDB.safeTransfer(feeRecipient, fee);
        }
        
        // Transfer USDT to user
        USDT.safeTransfer(msg.sender, usdtAmount);
        
        emit SwapUSDBToUSDT(msg.sender, amount, usdtAmount, fee);
    }

    // ==================== LIQUIDITY FUNCTIONS ====================
    
    /**
     * @dev Add liquidity to the contract
     */
    function addLiquidity(address token, uint256 amount) 
        external 
        onlyOwner 
    {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit LiquidityAdded(msg.sender, token, amount);
    }

    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Update BAM price (owner only)
     */
    function updateBAMPrice(uint256 newPrice) external onlyOwner {
        require(newPrice >= MIN_BAM_PRICE, "Price below minimum");
        require(newPrice <= MAX_BAM_PRICE, "Price above maximum");
        
        uint256 oldPrice = bamPriceInUSD;
        bamPriceInUSD = newPrice;
        
        emit BAMPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Update purchase limits
     */
    function updatePurchaseLimits(
        uint256 minAmount,
        uint256 maxAmount,
        uint256 maxPerWallet
    ) external onlyOwner {
        require(minAmount > 0, "Invalid minimum amount");
        require(maxAmount >= minAmount, "Max must be >= min");
        require(maxPerWallet >= maxAmount, "Max per wallet must be >= max amount");
        
        minPurchaseLimit = minAmount;
        maxPurchaseLimit = maxAmount;
        maxPurchasePerWallet = maxPerWallet;
        
        emit PurchaseLimitsUpdated(minAmount, maxAmount, maxPerWallet);
    }
    
    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }
    
    /**
     * @dev Update payment recipient
     */
    function updatePaymentRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        
        address oldRecipient = paymentRecipient;
        paymentRecipient = newRecipient;
        
        emit PaymentRecipientUpdated(oldRecipient, newRecipient);
    }

    // ==================== PRICE MANAGEMENT ====================
    
    /**
     * @dev Set Chainlink price feed address
     */
    function setPriceFeed(address newPriceFeed) external onlyOwner {
        require(newPriceFeed != address(0), "Invalid price feed");
        
        address oldFeed = address(priceFeed);
        priceFeed = AggregatorV3Interface(newPriceFeed);
        
        emit PriceFeedUpdated(oldFeed, newPriceFeed);
    }
    
    /**
     * @dev Update fallback BNB price
     */
    function updateFallbackBNBPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        
        fallbackBnbPrice = newPrice;
        
        if (useFallbackPrice) {
            emit PriceSourceChanged(true, newPrice);
        }
    }
    
    /**
     * @dev Toggle between Chainlink and fallback price
     */
    function togglePriceSource() external onlyOwner {
        useFallbackPrice = !useFallbackPrice;
        
        uint256 currentPrice = useFallbackPrice ? fallbackBnbPrice : getBNBPriceFromChainlink();
        emit PriceSourceChanged(useFallbackPrice, currentPrice);
    }

    // ==================== PAUSE CONTROLS ====================
    
    /**
     * @dev Pause/unpause individual functions
     */
    function pauseFunction(bytes4 functionSelector, bool isPaused) external onlyOwner {
        functionPaused[functionSelector] = isPaused;
        emit FunctionPauseToggled(functionSelector, isPaused);
    }
    
    /**
     * @dev Pause/unpause buyBAMWithUSDT
     */
    function pauseBuyBAMWithUSDT(bool _paused) external onlyOwner {
        functionPaused[this.buyBAMWithUSDT.selector] = _paused;
        emit FunctionPauseToggled(this.buyBAMWithUSDT.selector, _paused);
    }
    
    /**
     * @dev Pause/unpause buyBAMWithBNB
     */
    function pauseBuyBAMWithBNB(bool _paused) external onlyOwner {
        functionPaused[this.buyBAMWithBNB.selector] = _paused;
        emit FunctionPauseToggled(this.buyBAMWithBNB.selector, _paused);
    }
    
    /**
     * @dev Pause/unpause sellBAMForUSDT
     */
    function pauseSellBAMForUSDT(bool _paused) external onlyOwner {
        functionPaused[this.sellBAMForUSDT.selector] = _paused;
        emit FunctionPauseToggled(this.sellBAMForUSDT.selector, _paused);
    }
    
    /**
     * @dev Pause/unpause sellBAMForBNB
     */
    function pauseSellBAMForBNB(bool _paused) external onlyOwner {
        functionPaused[this.sellBAMForBNB.selector] = _paused;
        emit FunctionPauseToggled(this.sellBAMForBNB.selector, _paused);
    }
    
    /**
     * @dev Pause/unpause swapUSDTToUSDB
     */
    function pauseSwapUSDTToUSDB(bool _paused) external onlyOwner {
        functionPaused[this.swapUSDTToUSDB.selector] = _paused;
        emit FunctionPauseToggled(this.swapUSDTToUSDB.selector, _paused);
    }
    
    /**
     * @dev Pause/unpause swapUSDBToUSDT
     */
    function pauseSwapUSDBToUSDT(bool _paused) external onlyOwner {
        functionPaused[this.swapUSDBToUSDT.selector] = _paused;
        emit FunctionPauseToggled(this.swapUSDBToUSDT.selector, _paused);
    }

    // ==================== WALLET MANAGEMENT ====================
    
    /**
     * @dev Reset single wallet purchase history
     */
    function resetWalletPurchase(address wallet) external onlyOwner {
        uint256 previousAmount = walletPurchases[wallet];
        walletPurchases[wallet] = 0;
        
        emit WalletPurchaseReset(wallet, previousAmount);
    }
    
    /**
     * @dev Reset multiple wallet purchase histories
     */
    function resetMultipleWalletPurchases(address[] calldata wallets) external onlyOwner {
        for (uint256 i = 0; i < wallets.length; i++) {
            uint256 previousAmount = walletPurchases[wallets[i]];
            walletPurchases[wallets[i]] = 0;
            emit WalletPurchaseReset(wallets[i], previousAmount);
        }
    }

    // ==================== EMERGENCY FUNCTIONS ====================
    
    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        
        if (token == address(0)) {
            // Withdraw BNB
            require(address(this).balance >= amount, "Insufficient BNB balance");
            payable(owner()).transfer(amount);
        } else {
            // Withdraw ERC20 token
            IERC20(token).safeTransfer(owner(), amount);
        }
        
        emit EmergencyWithdrawal(token, amount, owner());
    }

    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get current BNB price from Chainlink or fallback
     */
    function getBNBPrice() public view returns (uint256) {
        if (useFallbackPrice) {
            return fallbackBnbPrice;
        }
        
        return getBNBPriceFromChainlink();
    }
    
    /**
     * @dev Get BNB price from Chainlink (internal)
     */
    function getBNBPriceFromChainlink() internal view returns (uint256) {
        try priceFeed.latestRoundData() returns (
            uint80, int256 answer, uint256, uint256, uint80
        ) {
            require(answer > 0, "Invalid price from Chainlink");
            return uint256(answer);
        } catch {
            return fallbackBnbPrice;
        }
    }
    
    /**
     * @dev Get purchase information for frontend
     */
    function getPurchaseInfo() external view returns (
        uint256 minPurchase,
        uint256 maxPurchase,
        uint256 maxPerWallet,
        uint256 currentBAMPrice,
        uint256 bamPerUSDT
    ) {
        return (
            minPurchaseLimit,
            maxPurchaseLimit,
            maxPurchasePerWallet,
            bamPriceInUSD,
            (1e12 * 1e18) / bamPriceInUSD // BAM tokens per 1 USDT
        );
    }
    
    /**
     * @dev Check if function is paused
     */
    function isFunctionPaused(bytes4 functionSelector) external view returns (bool) {
        return functionPaused[functionSelector];
    }
    
    /**
     * @dev Get contract token balances
     */
    function getContractBalances() external view returns (
        uint256 bnbBalance,
        uint256 usdtBalance,
        uint256 usdbBalance,
        uint256 bamBalance
    ) {
        return (
            address(this).balance,
            USDT.balanceOf(address(this)),
            USDB.balanceOf(address(this)),
            BAM.balanceOf(address(this))
        );
    }

    // ==================== RECEIVE FUNCTION ====================
    
    /**
     * @dev Allow contract to receive BNB
     */
    receive() external payable {
        // Allow contract to receive BNB for liquidity
    }
}