const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BAMSwap", function () {
  let bamSwap;
  let owner;
  let user1;
  let user2;
  
  // Mock token contracts (for testing)
  let mockUSDT;
  let mockUSDB; 
  let mockBAM;

  const INITIAL_BNB_PRICE = ethers.parseEther("600"); // $600 USD
  const BAM_PRICE = 100; // $0.0000001 in wei

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDT = await MockERC20.deploy("Tether USD", "USDT", 18);
    mockUSDB = await MockERC20.deploy("USD Balance", "USDB", 18);
    mockBAM = await MockERC20.deploy("Build And Multiply", "BAM", 18);

    // Deploy BAMSwap contract
    const BAMSwap = await ethers.getContractFactory("BAMSwap");
    bamSwap = await BAMSwap.deploy();

    // Mint tokens to owner for liquidity
    const liquidityAmount = ethers.parseEther("1000000");
    await mockUSDT.mint(owner.address, liquidityAmount);
    await mockUSDB.mint(owner.address, liquidityAmount);
    await mockBAM.mint(owner.address, liquidityAmount);

    // Mint tokens to users for testing
    const userAmount = ethers.parseEther("10000");
    await mockUSDT.mint(user1.address, userAmount);
    await mockUSDB.mint(user1.address, userAmount);
    await mockUSDT.mint(user2.address, userAmount);
    await mockUSDB.mint(user2.address, userAmount);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await bamSwap.owner()).to.equal(owner.address);
    });

    it("Should have correct initial BNB price", async function () {
      const priceInfo = await bamSwap.getPriceInfo();
      expect(priceInfo.bnbPrice).to.equal(INITIAL_BNB_PRICE);
    });

    it("Should have correct BAM price", async function () {
      const priceInfo = await bamSwap.getPriceInfo();
      expect(priceInfo.priceInUSD).to.equal(BAM_PRICE);
    });
  });

  describe("USDT to USDB Swap", function () {
    beforeEach(async function () {
      // Add liquidity to contract
      const liquidityAmount = ethers.parseEther("100000");
      await mockUSDB.approve(bamSwap.getAddress(), liquidityAmount);
      await bamSwap.addLiquidity(mockUSDB.getAddress(), liquidityAmount);
    });

    it("Should swap USDT to USDB at 1:1 ratio", async function () {
      const swapAmount = ethers.parseEther("100");
      
      await mockUSDT.connect(user1).approve(bamSwap.getAddress(), swapAmount);
      
      const initialUSDTBalance = await mockUSDT.balanceOf(user1.address);
      const initialUSDBBalance = await mockUSDB.balanceOf(user1.address);
      
      await bamSwap.connect(user1).swapUSDTToUSDB(swapAmount);
      
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(initialUSDTBalance - swapAmount);
      expect(await mockUSDB.balanceOf(user1.address)).to.equal(initialUSDBBalance + swapAmount);
    });

    it("Should revert with insufficient liquidity", async function () {
      const largeAmount = ethers.parseEther("200000");
      await mockUSDT.connect(user1).approve(bamSwap.getAddress(), largeAmount);
      
      await expect(
        bamSwap.connect(user1).swapUSDTToUSDB(largeAmount)
      ).to.be.revertedWith("Insufficient USDB liquidity");
    });
  });

  describe("USDB to USDT Swap", function () {
    beforeEach(async function () {
      // Add liquidity to contract
      const liquidityAmount = ethers.parseEther("100000");
      await mockUSDT.approve(bamSwap.getAddress(), liquidityAmount);
      await bamSwap.addLiquidity(mockUSDT.getAddress(), liquidityAmount);
    });

    it("Should swap USDB to USDT at 1:1 ratio", async function () {
      const swapAmount = ethers.parseEther("100");
      
      await mockUSDB.connect(user1).approve(bamSwap.getAddress(), swapAmount);
      
      const initialUSDTBalance = await mockUSDT.balanceOf(user1.address);
      const initialUSDBBalance = await mockUSDB.balanceOf(user1.address);
      
      await bamSwap.connect(user1).swapUSDBToUSDT(swapAmount);
      
      expect(await mockUSDB.balanceOf(user1.address)).to.equal(initialUSDBBalance - swapAmount);
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(initialUSDTBalance + swapAmount);
    });
  });

  describe("Buy BAM with USDT", function () {
    beforeEach(async function () {
      // Add BAM liquidity to contract
      const bamLiquidity = ethers.parseEther("100000000"); // 100M BAM tokens
      await mockBAM.approve(bamSwap.getAddress(), bamLiquidity);
      await bamSwap.addLiquidity(mockBAM.getAddress(), bamLiquidity);
    });

    it("Should buy BAM tokens with USDT at correct price", async function () {
      const usdtAmount = ethers.parseEther("1"); // 1 USDT
      const expectedBAMAmount = await bamSwap.getUSDTToBAMQuote(usdtAmount);
      
      await mockUSDT.connect(user1).approve(bamSwap.getAddress(), usdtAmount);
      
      const initialBAMBalance = await mockBAM.balanceOf(user1.address);
      
      await bamSwap.connect(user1).buyBAMWithUSDT(usdtAmount);
      
      expect(await mockBAM.balanceOf(user1.address)).to.equal(initialBAMBalance + expectedBAMAmount);
    });

    it("Should calculate correct BAM amount for USDT", async function () {
      const usdtAmount = ethers.parseEther("1");
      const bamAmount = await bamSwap.calculateBAMFromUSDT(usdtAmount);
      
      // 1 USDT should get 10,000,000 BAM tokens (1 USDT / 0.0000001 USD)
      const expectedAmount = ethers.parseEther("10000000");
      expect(bamAmount).to.equal(expectedAmount);
    });
  });

  describe("Buy BAM with BNB", function () {
    beforeEach(async function () {
      // Add BAM liquidity to contract
      const bamLiquidity = ethers.parseEther("100000000"); // 100M BAM tokens
      await mockBAM.approve(bamSwap.getAddress(), bamLiquidity);
      await bamSwap.addLiquidity(mockBAM.getAddress(), bamLiquidity);
    });

    it("Should buy BAM tokens with BNB at correct price", async function () {
      const bnbAmount = ethers.parseEther("1"); // 1 BNB
      const expectedBAMAmount = await bamSwap.getBNBToBAMQuote(bnbAmount);
      
      const initialBAMBalance = await mockBAM.balanceOf(user1.address);
      
      await bamSwap.connect(user1).buyBAMWithBNB({ value: bnbAmount });
      
      expect(await mockBAM.balanceOf(user1.address)).to.equal(initialBAMBalance + expectedBAMAmount);
    });

    it("Should calculate correct BAM amount for BNB", async function () {
      const bnbAmount = ethers.parseEther("1");
      const bamAmount = await bamSwap.calculateBAMFromBNB(bnbAmount);
      
      // 1 BNB at $600 should get 6,000,000,000,000 BAM tokens
      const expectedAmount = ethers.parseEther("6000000000000");
      expect(bamAmount).to.equal(expectedAmount);
    });
  });

  describe("Price Management", function () {
    it("Should update BNB price (owner only)", async function () {
      const newPrice = ethers.parseEther("700");
      
      await expect(bamSwap.updateBNBPrice(newPrice))
        .to.emit(bamSwap, "BNBPriceUpdated")
        .withArgs(INITIAL_BNB_PRICE, newPrice);
      
      const priceInfo = await bamSwap.getPriceInfo();
      expect(priceInfo.bnbPrice).to.equal(newPrice);
    });

    it("Should revert when non-owner tries to update price", async function () {
      const newPrice = ethers.parseEther("700");
      
      await expect(
        bamSwap.connect(user1).updateBNBPrice(newPrice)
      ).to.be.revertedWithCustomError(bamSwap, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    it("Should pause and unpause contract (owner only)", async function () {
      await bamSwap.pause();
      expect(await bamSwap.paused()).to.be.true;
      
      await bamSwap.unpause();
      expect(await bamSwap.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await bamSwap.pause();
      
      const swapAmount = ethers.parseEther("100");
      await mockUSDT.connect(user1).approve(bamSwap.getAddress(), swapAmount);
      
      await expect(
        bamSwap.connect(user1).swapUSDTToUSDB(swapAmount)
      ).to.be.revertedWithCustomError(bamSwap, "EnforcedPause");
    });

    it("Should allow emergency withdrawal (owner only)", async function () {
      // Add some tokens to contract first
      const amount = ethers.parseEther("1000");
      await mockUSDT.transfer(bamSwap.getAddress(), amount);
      
      const initialBalance = await mockUSDT.balanceOf(owner.address);
      
      await bamSwap.emergencyWithdraw(mockUSDT.getAddress(), amount);
      
      expect(await mockUSDT.balanceOf(owner.address)).to.equal(initialBalance + amount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct contract balances", async function () {
      const balances = await bamSwap.getContractBalances();
      
      expect(balances.usdtBalance).to.be.a("bigint");
      expect(balances.usdbBalance).to.be.a("bigint");
      expect(balances.bamBalance).to.be.a("bigint");
      expect(balances.bnbBalance).to.be.a("bigint");
    });

    it("Should return correct price info", async function () {
      const priceInfo = await bamSwap.getPriceInfo();
      
      expect(priceInfo.priceInUSD).to.equal(BAM_PRICE);
      expect(priceInfo.bnbPrice).to.equal(INITIAL_BNB_PRICE);
    });
  });
});

// Mock ERC20 contract for testing
contract MockERC20 {
  constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) {
    _decimals = decimals;
  }
  
  uint8 private _decimals;
  
  function decimals() public view override returns (uint8) {
    return _decimals;
  }
  
  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }
}