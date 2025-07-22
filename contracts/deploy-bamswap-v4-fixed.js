const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BAMSwapV3 with FIXED bamPriceInUSD for 1M BAM per USDT...");

  // BSC Mainnet token addresses
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
  const USDB_ADDRESS = "0x4050334836d59C1276068e496aB239DC80247675";
  const BAM_ADDRESS = "0xA779f03b752fa2442e6A23f145b007f2160F9a7D";
  
  // Recipients - YOU MUST UPDATE THESE ADDRESSES
  const FEE_RECIPIENT = "0x65b504C7204FF08C52cAf69eF090A2B0E763C00b"; // Update with your fee recipient wallet
  const PAYMENT_RECIPIENT = "0xEbF9c1C3F513D8f043a9A6A631ddc72cc1092F71"; // Update with your payment recipient wallet

  // Validate addresses are set
  if (FEE_RECIPIENT === "0x65b504C7204FF08C52cAf69eF090A2B0E763C00b" || PAYMENT_RECIPIENT === "0xEbF9c1C3F513D8f043a9A6A631ddc72cc1092F71") {
    throw new Error("❌ PLEASE UPDATE FEE_RECIPIENT and PAYMENT_RECIPIENT addresses before deploying!");
  }

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy contract
  const BAMSwapV3 = await hre.ethers.getContractFactory("BAMSwapV3");
  const bamSwapV3 = await BAMSwapV3.deploy(
    USDT_ADDRESS,
    USDB_ADDRESS,
    BAM_ADDRESS,
    FEE_RECIPIENT,
    PAYMENT_RECIPIENT
  );

  await bamSwapV3.deployed();

  console.log("✅ BAMSwapV3 deployed to:", bamSwapV3.address);
  console.log("");
  console.log("📋 DEPLOYMENT SUMMARY:");
  console.log("Contract Address:", bamSwapV3.address);
  console.log("USDT Address:", USDT_ADDRESS);
  console.log("USDB Address:", USDB_ADDRESS);
  console.log("BAM Address:", BAM_ADDRESS);
  console.log("Fee Recipient:", FEE_RECIPIENT);
  console.log("Payment Recipient:", PAYMENT_RECIPIENT);
  console.log("");
  
  // Verify initial configuration
  try {
    const bamPrice = await bamSwapV3.bamPriceInUSD();
    const minPurchase = await bamSwapV3.minPurchaseLimit();
    const maxPurchase = await bamSwapV3.maxPurchaseLimit();
    
    console.log("🔧 INITIAL CONFIGURATION:");
    console.log("BAM Price in USD:", bamPrice.toString(), "(should be 1000000 for 1M BAM per USDT)");
    console.log("Min Purchase Limit:", hre.ethers.utils.formatEther(minPurchase), "USDT");
    console.log("Max Purchase Limit:", hre.ethers.utils.formatEther(maxPurchase), "USDT");
    console.log("");
    
    // Calculate expected BAM tokens for verification
    const testAmount = hre.ethers.utils.parseEther("5"); // 5 USDT
    const expectedBAM = testAmount.mul(hre.ethers.BigNumber.from("1000000000000")).div(bamPrice);
    console.log("✅ VERIFICATION:");
    console.log("5 USDT should give:", hre.ethers.utils.formatEther(expectedBAM), "BAM tokens");
    console.log("Expected: 5,000,000 BAM");
    console.log("Correct:", hre.ethers.utils.formatEther(expectedBAM) === "5000000.0" ? "YES ✅" : "NO ❌");
    
  } catch (error) {
    console.log("⚠️ Could not verify configuration:", error.message);
  }

  console.log("");
  console.log("🔗 NEXT STEPS:");
  console.log("1. Update frontend contract address to:", bamSwapV3.address);
  console.log("2. Fund contract with BAM tokens for purchases");
  console.log("3. Verify contract on BSCScan if needed");
  console.log("");
  console.log("📝 FRONTEND UPDATE COMMAND:");
  console.log(`export const BAM_SWAP_ADDRESS = "${bamSwapV3.address}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });