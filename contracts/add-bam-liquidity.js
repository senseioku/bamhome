require('dotenv').config();
const { Web3 } = require('web3');

// Contract ABI for addLiquidity function
const CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "token", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// ERC20 ABI for approve function
const ERC20_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

const CONTRACT_ADDRESS = '0x2D2F3bD3D6C5a1cCE37211F4385D92F6F1DF0F86';
const BAM_TOKEN_ADDRESS = '0xA779f03b752fa2442e6A23f145b007f2160F9a7D';

async function addBAMLiquidity() {
    try {
        console.log('🚀 Adding 1 Billion BAM Liquidity...\n');

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
        console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);
        console.log(`🪙 BAM Token Address: ${BAM_TOKEN_ADDRESS}\n`);

        // Create contract instances
        const swapContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        const bamToken = new web3.eth.Contract(ERC20_ABI, BAM_TOKEN_ADDRESS);

        // Calculate 1 billion BAM tokens (BAM has 18 decimals)
        const oneMillionBAM = web3.utils.toWei('1000000', 'ether'); // 1M BAM
        const oneBillionBAM = web3.utils.toWei('1000000000', 'ether'); // 1B BAM

        console.log('💰 Liquidity Details:');
        console.log(`   • Amount: 1,000,000,000 BAM`);
        console.log(`   • Wei Value: ${oneBillionBAM}`);
        console.log(`   • Purpose: Increase contract liquidity for more sales\n`);

        // Check BAM balance of owner
        console.log('🔍 Checking BAM balance...');
        const bamBalance = await bamToken.methods.balanceOf(account.address).call();
        const bamBalanceFormatted = web3.utils.fromWei(bamBalance, 'ether');
        console.log(`   • Owner BAM Balance: ${bamBalanceFormatted} BAM`);

        if (parseFloat(bamBalanceFormatted) < 1000000000) {
            console.log('   ⚠️  Warning: Insufficient BAM balance for 1B transfer');
            console.log(`   • Available: ${bamBalanceFormatted} BAM`);
            console.log(`   • Required: 1,000,000,000 BAM\n`);
        }

        // Step 1: Approve BAM Swap contract to spend BAM tokens
        console.log('✅ Step 1: Approving BAM Swap contract...');
        const approveGas = await bamToken.methods.approve(CONTRACT_ADDRESS, oneBillionBAM).estimateGas({from: account.address});
        console.log(`   • Estimated Gas: ${approveGas}`);

        const approveTx = await bamToken.methods.approve(CONTRACT_ADDRESS, oneBillionBAM).send({
            from: account.address,
            gas: Math.floor(approveGas * 1.2),
            gasPrice: await web3.eth.getGasPrice()
        });
        console.log(`   ✅ Approval Complete! TX: ${approveTx.transactionHash}`);

        // Step 2: Add liquidity to contract
        console.log('\n💧 Step 2: Adding BAM liquidity...');
        const liquidityGas = await swapContract.methods.addLiquidity(BAM_TOKEN_ADDRESS, oneBillionBAM).estimateGas({from: account.address});
        console.log(`   • Estimated Gas: ${liquidityGas}`);

        const liquidityTx = await swapContract.methods.addLiquidity(BAM_TOKEN_ADDRESS, oneBillionBAM).send({
            from: account.address,
            gas: Math.floor(liquidityGas * 1.2),
            gasPrice: await web3.eth.getGasPrice()
        });
        console.log(`   ✅ Liquidity Added! TX: ${liquidityTx.transactionHash}`);

        console.log('\n🎉 LIQUIDITY ADDITION COMPLETE!');
        console.log('\n📊 Results:');
        console.log('   • 1,000,000,000 BAM tokens added to contract');
        console.log('   • Contract can now handle 100,000 purchases (10K BAM each)');
        console.log('   • Or 1,000 purchases at Presale 2 rates (1M BAM each)');
        console.log('   • Substantial liquidity for community growth');
        console.log('\n🚀 Contract ready for increased demand!');

    } catch (error) {
        console.error('❌ Error adding liquidity:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Solutions:');
            console.log('   • Ensure wallet has enough BAM tokens');
            console.log('   • Check wallet has BNB for gas fees');
            console.log('   • Verify contract addresses are correct');
        }
        
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    addBAMLiquidity()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { addBAMLiquidity };