require('dotenv').config();
const { Web3 } = require('web3');

// Contract ABI for the price update functions
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "newPrice", "type": "uint256"}],
        "name": "updateBAMPrice",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const CONTRACT_ADDRESS = '0x2D2F3bD3D6C5a1cCE37211F4385D92F6F1DF0F86';

async function fixPresale2Price() {
    try {
        console.log('🔧 Fixing Presale 2 BAM Price to Exact $0.000002...\n');

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

        // CORRECT calculation for 0.000002 USDT per BAM:
        // Target: 2 USDT = 1,000,000 BAM
        // Formula: (usdtAmount * 1e18) / bamPriceInUSD = BAM amount
        // We want: (2 * 1e18) / bamPriceInUSD = 1,000,000 * 1e18
        // Solving: bamPriceInUSD = (2 * 1e18) / (1,000,000 * 1e18) = 2e12
        const correctBAMPrice = '2000000000000'; // 2e12

        console.log('🎯 Correct Presale 2 Configuration:');
        console.log('   • Target Price: $0.000002 per BAM');
        console.log('   • Purchase: 2 USDT = 1,000,000 BAM');
        console.log('   • BAM Price Value: 2000000000000 (2e12)');
        console.log('   • Revenue: $2.00 per wallet\n');

        console.log('💰 Updating BAM Price to correct value...');
        const priceGas = await contract.methods.updateBAMPrice(correctBAMPrice).estimateGas({from: account.address});
        console.log(`   • Estimated Gas: ${priceGas}`);

        const priceTx = await contract.methods.updateBAMPrice(correctBAMPrice).send({
            from: account.address,
            gas: Math.floor(priceGas * 1.2),
            gasPrice: await web3.eth.getGasPrice()
        });
        console.log(`   ✅ Price Fixed! TX: ${priceTx.transactionHash}`);

        console.log('\n🎉 PRESALE 2 PRICE CORRECTION COMPLETE!');
        console.log('\n📊 Final Settings:');
        console.log('   • BAM Price: $0.000002 USDT per BAM');
        console.log('   • Purchase: Exactly 2 USDT per wallet');
        console.log('   • BAM Received: 1,000,000 BAM per purchase');
        console.log('   • Value: Much better value than before!');
        console.log('\n🚀 Ready for proper Presale 2 launch!');

    } catch (error) {
        console.error('❌ Error fixing price:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    fixPresale2Price()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixPresale2Price };