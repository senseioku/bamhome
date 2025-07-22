require('dotenv').config();
const { Web3 } = require('web3');

const CONTRACT_ABI = [
  {
    'inputs': [],
    'name': 'bamPriceInUSD',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'exactPurchaseAmount',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'maxPurchasePerWallet',
    'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
    'stateMutability': 'view',
    'type': 'function'
  }
];

const CONTRACT_ADDRESS = '0x2D2F3bD3D6C5a1cCE37211F4385D92F6F1DF0F86';

async function checkContractStatus() {
  try {
    console.log('🔍 Checking BAM Swap Contract Status...\n');
    
    const web3 = new Web3('https://bsc-dataseed1.binance.org/');
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    console.log(`📍 Contract: ${CONTRACT_ADDRESS}\n`);
    
    // Get current settings
    const bamPrice = await contract.methods.bamPriceInUSD().call();
    const exactAmount = await contract.methods.exactPurchaseAmount().call();
    const maxAmount = await contract.methods.maxPurchasePerWallet().call();
    
    console.log('📊 Current Contract Settings:');
    console.log(`   BAM Price (raw): ${bamPrice}`);
    
    // Calculate BAM per USDT
    const bamPerUSDT = (1e18 / parseFloat(bamPrice)).toLocaleString();
    console.log(`   BAM per 1 USDT: ${bamPerUSDT} BAM`);
    
    // Calculate USD price per BAM
    const usdPerBAM = (parseFloat(bamPrice) / 1e18).toFixed(9);
    console.log(`   Price per BAM: $${usdPerBAM}`);
    
    const exactUSDT = web3.utils.fromWei(exactAmount, 'ether');
    const maxUSDT = web3.utils.fromWei(maxAmount, 'ether');
    console.log(`   Exact Purchase: ${exactUSDT} USDT`);
    console.log(`   Max Per Wallet: ${maxUSDT} USDT\n`);
    
    // Check if updated to Presale 2 settings
    console.log('🎯 Presale Status Check:');
    
    if (bamPrice === '200000000000') {
      console.log('   ✅ PRESALE 2 ACTIVE');
      console.log('   • BAM Price: $0.000002 (20x from Presale 1)');
      console.log('   • 1 USDT = 500,000 BAM');
      console.log('   • 2 USDT = 1,000,000 BAM');
    } else if (bamPrice === '100000000000') {
      console.log('   ℹ️  PRESALE 1 STILL ACTIVE');
      console.log('   • BAM Price: $0.0000001');
      console.log('   • 1 USDT = 10,000,000 BAM');
    } else {
      console.log('   ❓ CUSTOM PRICE SETTING');
      console.log(`   • Current price: $${usdPerBAM} per BAM`);
    }
    
    if (exactAmount === web3.utils.toWei('2', 'ether')) {
      console.log('   ✅ PURCHASE LIMIT: 2 USDT per wallet');
    } else if (exactAmount === web3.utils.toWei('1', 'ether')) {
      console.log('   ℹ️  PURCHASE LIMIT: 1 USDT per wallet (Presale 1)');
    } else {
      console.log(`   ❓ CUSTOM LIMIT: ${exactUSDT} USDT per wallet`);
    }
    
    console.log('\n🚀 Summary:');
    if (bamPrice === '200000000000' && exactAmount === web3.utils.toWei('2', 'ether')) {
      console.log('   🎉 PRESALE 2 FULLY CONFIGURED!');
      console.log('   • Price: $0.000002 per BAM (20x increase)');
      console.log('   • Purchase: Exactly 2 USDT per wallet');
      console.log('   • Tokens: 1,000,000 BAM per purchase');
      console.log('   • Revenue: $2.00 per sale (4x increase)');
    } else {
      console.log('   ⚠️  Configuration incomplete or custom settings');
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message);
  }
}

checkContractStatus();