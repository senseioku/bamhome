const { ethers } = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0xF30A71a63c1dF17eA47ed80A164d9C5a75A7747E";
  
  // Get contract instance
  const bamSwap = await ethers.getContractAt("BAMSwapV2", CONTRACT_ADDRESS);
  
  console.log("Current BAM price:", await bamSwap.bamPriceInUSD());
  
  // Update to correct price: 1e6 for $0.000001 per BAM
  const tx = await bamSwap.updateBAMPrice(1000000); // 1e6
  await tx.wait();
  
  console.log("✅ BAM price updated to:", await bamSwap.bamPriceInUSD());
  console.log("🧮 5 USDT now gives:", ethers.formatEther((BigInt(5e18) * BigInt(1e12)) / BigInt(1000000)), "BAM");
}

main().catch(console.error);