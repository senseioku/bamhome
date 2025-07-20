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
  const priceInfo = await bamSwap.getPriceInfo();
  console.log("BAM Price in USD:", priceInfo.priceInUSD.toString(), "wei");
  console.log("BNB Price in USD:", ethers.formatEther(priceInfo.bnbPrice), "USD");
  
  // Verify contract balances
  const balances = await bamSwap.getContractBalances();
  console.log("\nContract Balances:");
  console.log("USDT:", ethers.formatEther(balances.usdtBalance));
  console.log("USDB:", ethers.formatEther(balances.usdbBalance));
  console.log("BAM:", ethers.formatEther(balances.bamBalance));
  console.log("BNB:", ethers.formatEther(balances.bnbBalance));
  
  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("\nNext steps:");
  console.log("1. Add liquidity for USDT, USDB, and BAM tokens");
  console.log("2. Update BNB price if needed");
  console.log("3. Verify contract on BSCScan");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });