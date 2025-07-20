const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BAM Swap Contract...");
  console.log("Network:", hre.network.name);

  // Security check - ensure private key is loaded
  if (hre.network.name === "bsc" || hre.network.name === "bscTestnet") {
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is required for deployment");
    }
    if (!process.env.BSCSCAN_API_KEY) {
      console.warn("⚠️  BSCSCAN_API_KEY not set - contract verification will fail");
    }
  }

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");
  
  // Check minimum balance for deployment
  const minBalance = ethers.parseEther("0.01"); // 0.01 BNB minimum
  if (balance < minBalance) {
    throw new Error(`Insufficient balance. Need at least 0.01 BNB, have ${ethers.formatEther(balance)} BNB`);
  }

  // Deploy the contract
  const BAMSwap = await ethers.getContractFactory("BAMSwap");
  const bamSwap = await BAMSwap.deploy();
  
  await bamSwap.waitForDeployment();
  const contractAddress = await bamSwap.getAddress();
  
  console.log("BAM Swap deployed to:", contractAddress);
  
  // Get contract info
  const contractInfo = await bamSwap.getContractInfo();
  console.log("BAM Price in USD: $0.0000001");
  console.log("BNB Price in USD:", ethers.formatEther(contractInfo.currentBNBPrice), "USD");
  console.log("Price Source:", contractInfo.isUsingFallback ? "Fallback" : "Chainlink Oracle");
  console.log("Price Valid:", contractInfo.priceIsValid ? "Yes" : "No");
  
  // Verify contract balances  
  console.log("\nContract Balances:");
  console.log("USDT:", ethers.formatEther(contractInfo.usdtBalance));
  console.log("USDB:", ethers.formatEther(contractInfo.usdbBalance));
  console.log("BAM:", ethers.formatEther(contractInfo.bamBalance));
  console.log("BNB:", ethers.formatEther(contractInfo.bnbBalance));
  
  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("\nNext steps:");
  console.log("1. Add liquidity for USDT, USDB, and BAM tokens");
  console.log("2. Verify Chainlink price feed is working correctly");
  console.log("3. Update fallback price if needed");
  console.log("4. Verify contract on BSCScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });