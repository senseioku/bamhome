const { Web3 } = require('web3');
require('dotenv').config();

// Contract details
const CONTRACT_ADDRESS = '0x6fCbbc0834E9c0E3AFc4A96F47a19E29b6261934';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your wallet private key
const BSC_RPC = 'https://bsc-dataseed1.binance.org/';

// Contract ABI (only functions we need)
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_bamPrice", "type": "uint256"}],
    "name": "updateBAMPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_minAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxPerWallet", "type": "uint256"}
    ],
    "name": "updatePurchaseLimits",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function updatePresale3() {
  try {
    console.log('🚀 Starting Presale 3 Configuration Update...');
    
    // Initialize Web3
    const web3 = new Web3(BSC_RPC);
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    
    // Contract instance
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    // Presale 3 Parameters
    // Price: $0.0000025 per BAM = 400,000 BAM per USDT
    const bamPriceInUSD = '2500000'; // 2.5e6 for $0.0000025 per BAM
    const minPurchase = web3.utils.toWei('5', 'ether');     // 5 USDT
    const maxPurchase = web3.utils.toWei('100', 'ether');   // 100 USDT
    const maxPerWallet = web3.utils.toWei('100', 'ether');  // 100 USDT per wallet
    
    console.log('📊 Presale 3 Configuration:');
    console.log(`- BAM Price: $0.0000025 (${bamPriceInUSD} contract units)`);
    console.log(`- Purchase Range: 5-100 USDT per wallet`);
    console.log(`- Expected BAM amounts: 5 USDT = 2M BAM, 50 USDT = 20M BAM, 100 USDT = 40M BAM`);
    
    // Update BAM price
    console.log('\n1️⃣ Updating BAM price...');
    const priceTx = await contract.methods.updateBAMPrice(bamPriceInUSD).send({
      from: account.address,
      gas: 100000,
      gasPrice: web3.utils.toWei('5', 'gwei')
    });
    console.log(`✅ BAM price updated! TX: ${priceTx.transactionHash}`);
    
    // Update purchase limits
    console.log('\n2️⃣ Updating purchase limits...');
    const limitsTx = await contract.methods.updatePurchaseLimits(
      minPurchase,
      maxPurchase, 
      maxPerWallet
    ).send({
      from: account.address,
      gas: 150000,
      gasPrice: web3.utils.toWei('5', 'gwei')
    });
    console.log(`✅ Purchase limits updated! TX: ${limitsTx.transactionHash}`);
    
    console.log('\n🎉 PRESALE 3 SUCCESSFULLY CONFIGURED!');
    console.log('\n📈 New Configuration:');
    console.log('- Phase: Presale 3');
    console.log('- BAM Price: $0.0000025 per token');
    console.log('- Purchase Range: 5-100 USDT per wallet');
    console.log('- BAM Rewards: 5 USDT = 2M BAM, 50 USDT = 20M BAM, 100 USDT = 40M BAM');
    console.log('\n✅ Ready for Presale 3 launch!');
    
  } catch (error) {
    console.error('❌ Error updating Presale 3:', error.message);
    process.exit(1);
  }
}

// Run the update
updatePresale3();