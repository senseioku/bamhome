const { ethers } = require("ethers");
const CONTRACT_ADDRESS = "0xF30A71a63c1dF17eA47ed80A164d9C5a75A7747E";
const ABI = [{"inputs":[{"internalType":"uint256","name":"newPrice","type":"uint256"}],"name":"updateBAMPrice","outputs":[],"stateMutability":"nonpayable","type":"function"}];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  
  console.log("Updating BAM price...");
  const tx = await contract.updateBAMPrice(1000000); // 1e6 for correct calculation
  await tx.wait();
  console.log("✅ Fixed! 5 USDT now gives 5,000,000 BAM");
}
main().catch(console.error);
