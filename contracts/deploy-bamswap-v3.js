const { ethers } = require("hardhat");

// BSC Mainnet Contract Addresses
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDB_ADDRESS = "0xd17479997F34dd9156Deef8F95A52D81D6Fd8503"; 
const BAM_ADDRESS = "0x4DB2c02831e05ebb6d6fC7Bf1b765c5A8259632C";

// Current V2 configuration
const FEE_RECIPIENT = "0x742d35Cc6370C4C67C2f619192309a8E7e0C4b84";
const PAYMENT_RECIPIENT = "0x742d35Cc6370C4C67C2f619192309a8E7e0C4b84";

async function main() {
  console.log("🚀 Deploying BAMSwapV3 with Complete Functionality...");
  console.log("================================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB");
  
  // Get contract factory
  const BAMSwapV3 = await ethers.getContractFactory("BAMSwapV3");
  
  // Deploy contract
  console.log("\n📋 Deployment Parameters:");
  console.log("USDT Address:", USDT_ADDRESS);
  console.log("USDB Address:", USDB_ADDRESS);
  console.log("BAM Address:", BAM_ADDRESS);
  console.log("Fee Recipient:", FEE_RECIPIENT);
  console.log("Payment Recipient:", PAYMENT_RECIPIENT);
  
  const bamSwapV3 = await BAMSwapV3.deploy(
    USDT_ADDRESS,
    USDB_ADDRESS,
    BAM_ADDRESS,
    FEE_RECIPIENT,
    PAYMENT_RECIPIENT
  );
  
  await bamSwapV3.deployed();
  
  console.log("\n✅ BAMSwapV3 deployed successfully!");
  console.log("Contract Address:", bamSwapV3.address);
  console.log("Transaction Hash:", bamSwapV3.deployTransaction.hash);
  
  // Wait for confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await bamSwapV3.deployTransaction.wait(3);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const code = await ethers.provider.getCode(bamSwapV3.address);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  
  // Test basic functions
  console.log("\n🧪 Testing basic contract functions...");
  try {
    const bamPrice = await bamSwapV3.bamPriceInUSD();
    const minLimit = await bamSwapV3.minPurchaseLimit();
    const maxLimit = await bamSwapV3.maxPurchaseLimit();
    const owner = await bamSwapV3.owner();
    
    console.log("BAM Price:", ethers.utils.formatUnits(bamPrice, 12), "USD");
    console.log("Min Purchase:", ethers.utils.formatEther(minLimit), "USDT");
    console.log("Max Purchase:", ethers.utils.formatEther(maxLimit), "USDT");
    console.log("Contract Owner:", owner);
    
    // Test purchase info function
    const purchaseInfo = await bamSwapV3.getPurchaseInfo();
    console.log("Purchase Info:");
    console.log("  Min:", ethers.utils.formatEther(purchaseInfo[0]), "USDT");
    console.log("  Max:", ethers.utils.formatEther(purchaseInfo[1]), "USDT");
    console.log("  Max Per Wallet:", ethers.utils.formatEther(purchaseInfo[2]), "USDT");
    console.log("  BAM Price:", ethers.utils.formatUnits(purchaseInfo[3], 12), "USD");
    console.log("  BAM per USDT:", ethers.utils.formatEther(purchaseInfo[4]));
    
  } catch (error) {
    console.error("❌ Error testing functions:", error.message);
  }
  
  // Contract summary
  console.log("\n📊 Deployment Summary:");
  console.log("======================");
  console.log("Contract: BAMSwapV3");
  console.log("Address:", bamSwapV3.address);
  console.log("Network: BSC Mainnet");
  console.log("Features: Complete DeFi Platform");
  console.log("- Purchase Range: 2-5 USDT flexible");
  console.log("- USDT/USDB swaps: ✅");
  console.log("- BAM buy/sell: ✅");
  console.log("- Granular controls: ✅");
  console.log("- Price management: ✅");
  console.log("- Emergency functions: ✅");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Verify contract on BSCScan");
  console.log("2. Add liquidity to contract");
  console.log("3. Update frontend to use new address");
  console.log("4. Test all functions in production");
  console.log("5. Migrate from V2 when ready");
  
  // Save deployment info
  const deploymentInfo = {
    contractName: "BAMSwapV3",
    address: bamSwapV3.address,
    deployer: deployer.address,
    network: "BSC Mainnet",
    deploymentTime: new Date().toISOString(),
    transactionHash: bamSwapV3.deployTransaction.hash,
    gasUsed: bamSwapV3.deployTransaction.gasLimit?.toString(),
    constructorArgs: [
      USDT_ADDRESS,
      USDB_ADDRESS,
      BAM_ADDRESS,
      FEE_RECIPIENT,
      PAYMENT_RECIPIENT
    ]
  };
  
  console.log("\n💾 Deployment Info JSON:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });