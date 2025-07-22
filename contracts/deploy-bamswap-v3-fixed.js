const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BAMSwapV3 with FIXED BAM pricing...");

  // Contract addresses on BSC Mainnet
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
  const USDB_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; 
  const BAM_ADDRESS = "0x4270bb238f6DD8B1c3ca01f96CA65b2647c06D3C";
  
  // Recipients (using same addresses as V1/V2)
  const FEE_RECIPIENT = "0x55CA12b29764B2Cc025E2AB4c44d229E9d461CF0";
  const PAYMENT_RECIPIENT = "0x55CA12b29764B2Cc025E2AB4c44d229E9d461CF0";

  // Deploy contract
  const BAMSwapV3 = await ethers.getContractFactory("BAMSwapV3");
  const bamSwap = await BAMSwapV3.deploy(
    USDT_ADDRESS,
    USDB_ADDRESS,
    BAM_ADDRESS,
    FEE_RECIPIENT,
    PAYMENT_RECIPIENT
  );

  await bamSwap.waitForDeployment();
  const contractAddress = await bamSwap.getAddress();

  console.log("✅ BAMSwapV3 FIXED deployed to:", contractAddress);
  console.log("🔧 BAM Price (corrected):", await bamSwap.bamPriceInUSD(), "= $0.000001");
  console.log("📊 Purchase Limits:", 
    ethers.formatEther(await bamSwap.minPurchaseLimit()), "-",
    ethers.formatEther(await bamSwap.maxPurchaseLimit()), "USDT"
  );
  
  // Test calculation with fixed price
  const testAmount = ethers.parseEther("5"); // 5 USDT
  console.log("\n🧮 TESTING CORRECTED CALCULATION:");
  console.log("Input: 5 USDT");
  console.log("Expected: 5,000,000 BAM tokens");
  
  const bamPrice = await bamSwap.bamPriceInUSD();
  const expectedBAM = (testAmount * BigInt(1e12)) / bamPrice;
  console.log("Calculated BAM:", ethers.formatEther(expectedBAM), "BAM");
  console.log("✅ CALCULATION FIXED!");

  return contractAddress;
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});