require('dotenv').config();
const { Web3 } = require('web3');

const CONTRACT_ABI = [
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

async function updatePurchaseLimits() {
    try {
        console.log('🔧 Updating Purchase Limits: 2 USDT min - 5 USDT max...\n');

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

        // Convert to wei (18 decimals)
        const minAmount = web3.utils.toWei('2', 'ether'); // 2 USDT minimum
        const maxAmount = web3.utils.toWei('5', 'ether'); // 5 USDT maximum

        console.log('💰 New Purchase Limits:');
        console.log(`   • Minimum: 2 USDT (${minAmount} wei)`);
        console.log(`   • Maximum: 5 USDT (${maxAmount} wei)`);
        console.log('   • BAM per purchase: 2M - 5M BAM tokens');
        console.log('   • Revenue range: $2 - $5 per wallet\n');

        console.log('⚡ Updating purchase limits...');
        const gas = await contract.methods.updatePurchaseLimits(minAmount, maxAmount).estimateGas({from: account.address});
        console.log(`   • Estimated Gas: ${gas}`);

        const tx = await contract.methods.updatePurchaseLimits(minAmount, maxAmount).send({
            from: account.address,
            gas: Math.floor(gas * 1.2),
            gasPrice: await web3.eth.getGasPrice()
        });
        console.log(`   ✅ Limits Updated! TX: ${tx.transactionHash}`);

        console.log('\n🎉 PURCHASE LIMITS UPDATE COMPLETE!');
        console.log('\n📊 New Settings Active:');
        console.log('   • Minimum Purchase: 2 USDT = 2,000,000 BAM');
        console.log('   • Maximum Purchase: 5 USDT = 5,000,000 BAM');
        console.log('   • Flexible purchasing within range');
        console.log('   • Higher revenue potential per wallet');
        console.log('\n🚀 Ready for enhanced Presale 2!');

    } catch (error) {
        console.error('❌ Error updating limits:', error.message);
        process.exit(1);
    }
}

updatePurchaseLimits();