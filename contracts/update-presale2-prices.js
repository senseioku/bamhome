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

async function updatePresale2Settings() {
    try {
        console.log('🚀 Starting Presale 2 Configuration...\n');

        // Initialize Web3 with BSC mainnet
        const web3 = new Web3('https://bsc-dataseed1.binance.org/');
        
        // Load private key from environment
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY not found in .env file');
        }

        // Ensure private key has 0x prefix
        const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

        // Create account from private key
        const account = web3.eth.accounts.privateKeyToAccount(formattedPrivateKey);
        web3.eth.accounts.wallet.add(account);

        console.log(`📝 Owner Address: ${account.address}`);
        console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}\n`);

        // Create contract instance
        const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        // Calculate new BAM price
        // Current: 0.0000001 USDT = 1e11 wei
        // New: 0.000002 USDT = 2e15 wei (20x higher)
        const newBAMPrice = '2000000000000000'; // 2e15 in string format

        // Calculate new purchase limits
        // 2 USDT = 2 * 10^6 wei (USDT has 6 decimals)
        const newExactAmount = '2000000'; // 2 USDT in wei
        const newMaxPerWallet = '2000000'; // 2 USDT in wei

        console.log('📊 Presale 2 Configuration:');
        console.log(`   • BAM Price: $0.000002 USDT (was $0.0000001)`);
        console.log(`   • Price Increase: 20x higher`);
        console.log(`   • Min Purchase: 2 USDT (was 1 USDT)`);
        console.log(`   • Max Purchase: 2 USDT (was 1 USDT)`);
        console.log(`   • Tokens per 2 USDT: 1,000,000 BAM (was 10,000,000)\n`);

        // Estimate gas for both transactions
        console.log('⛽ Estimating gas costs...');
        
        const priceGas = await contract.methods.updateBAMPrice(newBAMPrice).estimateGas({from: account.address});
        const limitsGas = await contract.methods.updatePurchaseLimits(newExactAmount, newMaxPerWallet).estimateGas({from: account.address});
        
        console.log(`   • Price Update Gas: ${priceGas}`);
        console.log(`   • Limits Update Gas: ${limitsGas}\n`);

        // Get current gas price
        const gasPrice = await web3.eth.getGasPrice();
        console.log(`   • Current Gas Price: ${web3.utils.fromWei(gasPrice, 'gwei')} Gwei\n`);

        // Update BAM Price
        console.log('💰 Updating BAM Price to $0.000002...');
        const priceTx = await contract.methods.updateBAMPrice(newBAMPrice).send({
            from: account.address,
            gas: Math.floor(priceGas * 1.2), // 20% buffer
            gasPrice: gasPrice
        });
        console.log(`   ✅ Price Updated! TX: ${priceTx.transactionHash}`);

        // Update Purchase Limits
        console.log('\n💳 Updating Purchase Limits to 2 USDT...');
        const limitsTx = await contract.methods.updatePurchaseLimits(newExactAmount, newMaxPerWallet).send({
            from: account.address,
            gas: Math.floor(limitsGas * 1.2), // 20% buffer
            gasPrice: gasPrice
        });
        console.log(`   ✅ Limits Updated! TX: ${limitsTx.transactionHash}`);

        console.log('\n🎉 PRESALE 2 CONFIGURATION COMPLETE!');
        console.log('\n📈 New Settings Active:');
        console.log('   • BAM Price: $0.000002 USDT (20x increase)');
        console.log('   • Purchase Amount: Exactly 2 USDT per wallet');
        console.log('   • BAM Received: 1,000,000 BAM per purchase');
        console.log('   • Revenue per Sale: $2.00 (vs $1.00 in Presale 1)');
        console.log('\n🔥 Ready for Presale 2 launch!');

    } catch (error) {
        console.error('❌ Error updating contract:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    updatePresale2Settings()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { updatePresale2Settings };