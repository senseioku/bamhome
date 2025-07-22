require('dotenv').config();
const { Web3 } = require('web3');

// Contract ABI for the update functions
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "newPrice", "type": "uint256"}],
        "name": "updateBAMPrice",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "newExactAmount", "type": "uint256"},
            {"internalType": "uint256", "name": "newMaxPerWallet", "type": "uint256"}
        ],
        "name": "updatePurchaseLimits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const CONTRACT_ADDRESS = '0x2D2F3bD3D6C5a1cCE37211F4385D92F6F1DF0F86';

async function alternativePresale2() {
    try {
        console.log('🔧 Alternative Presale 2 Configuration...\n');

        const web3 = new Web3('https://bsc-dataseed1.binance.org/');
        
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY not found in .env file');
        }

        const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        const account = web3.eth.accounts.privateKeyToAccount(formattedPrivateKey);
        web3.eth.accounts.wallet.add(account);

        console.log(`📝 Owner Address: ${account.address}`);
        console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}\n`);

        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        // Option 1: Maximum allowed price for closest to your target
        const maxAllowedPrice = '1000000000000'; // 1e12 (contract maximum)
        const oneUSDT = '1000000000000000000'; // 1 USDT in 18 decimals

        console.log('🎯 Alternative Configuration Options:');
        console.log('\n📊 OPTION 1: Use Contract Maximum Price');
        console.log('   • BAM Price: 1e12 (maximum allowed)');
        console.log('   • Purchase: 2 USDT = 2,000,000 BAM');
        console.log('   • Price per BAM: $0.000001 (5x your target)');
        console.log('   • Users get MORE tokens than your target');
        
        console.log('\n📊 OPTION 2: Reduce Purchase to 1 USDT');
        console.log('   • BAM Price: 1e12 (maximum allowed)');
        console.log('   • Purchase: 1 USDT = 1,000,000 BAM');
        console.log('   • Price per BAM: $0.000001 (5x your target)');
        console.log('   • Matches your 1M BAM target but lower revenue');

        console.log('\n💡 RECOMMENDATION: Option 1');
        console.log('   • Keep 2 USDT purchase for higher revenue');
        console.log('   • Give users better value (2M BAM instead of 1M)');
        console.log('   • Still 10x price increase from Presale 1');
        console.log('   • Contract limits prevent exact $0.000002 target\n');

        // Execute Option 1: Maximum price with 2 USDT purchase
        console.log('⚡ Implementing Option 1...');
        
        // Update BAM price to maximum allowed
        console.log('💰 Setting BAM price to maximum allowed (1e12)...');
        const priceGas = await contract.methods.updateBAMPrice(maxAllowedPrice).estimateGas({from: account.address});
        
        const priceTx = await contract.methods.updateBAMPrice(maxAllowedPrice).send({
            from: account.address,
            gas: Math.floor(priceGas * 1.2),
            gasPrice: await web3.eth.getGasPrice()
        });
        console.log(`   ✅ Price Updated! TX: ${priceTx.transactionHash}`);

        console.log('\n🎉 ALTERNATIVE PRESALE 2 COMPLETE!');
        console.log('\n📊 Final Settings:');
        console.log('   • BAM Price: $0.000001 per BAM (contract maximum)');
        console.log('   • Purchase: Exactly 2 USDT per wallet');
        console.log('   • BAM Received: 2,000,000 BAM per purchase');
        console.log('   • Better value for users (more tokens)');
        console.log('   • Revenue: $2.00 per wallet');
        console.log('\n🚀 Ready with maximum allowed pricing!');

    } catch (error) {
        console.error('❌ Error configuring alternative:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    alternativePresale2()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { alternativePresale2 };