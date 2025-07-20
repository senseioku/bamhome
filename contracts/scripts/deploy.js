const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BAM Swap Contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

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
  console.log("4. Verify contract on BSCScan");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });