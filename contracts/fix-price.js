const Web3 = require("web3");
const web3 = new Web3("https://bsc-dataseed1.binance.org/");
const ABI = [{"inputs":[{"internalType":"uint256","name":"newPrice","type":"uint256"}],"name":"updateBAMPrice","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const contract = new web3.eth.Contract(ABI, "0xF30A71a63c1dF17eA47ed80A164d9C5a75A7747E");
async function fix() {
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
  const tx = contract.methods.updateBAMPrice("100000000000"); // 1e11 (V1 correct value)
  const gas = await tx.estimateGas({from: account.address});
  const signed = await account.signTransaction({to: "0xF30A71a63c1dF17eA47ed80A164d9C5a75A7747E", data: tx.encodeABI(), gas});
  await web3.eth.sendSignedTransaction(signed.rawTransaction);
  console.log("✅ Fixed BAM price to 1e11 - now gives 10M BAM per USDT");
}
fix().catch(console.error);
