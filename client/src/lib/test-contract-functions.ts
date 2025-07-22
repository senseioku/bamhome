// Test deployed contract functions to ensure interface matches smart contract
import Web3 from 'web3';
import { BAMSWAP_V2_ABI } from './bamswap-v2-abi';

const CONTRACT_ADDRESS = '0xaE97797f29a0f3d5602325E2668e5920C2820455';
const BSC_RPC = 'https://bsc-dataseed1.binance.org/';

export async function testContractFunctions() {
  console.log('🔍 Testing deployed contract functions...');
  
  try {
    const web3 = new Web3(BSC_RPC);
    const contract = new web3.eth.Contract(BAMSWAP_V2_ABI, CONTRACT_ADDRESS);
    
    console.log('📋 Testing view functions:');
    
    // Test bamPriceInUSD
    try {
      const bamPrice = await contract.methods.bamPriceInUSD().call();
      console.log('✅ bamPriceInUSD():', bamPrice);
    } catch (error) {
      console.log('❌ bamPriceInUSD() failed:', error.message);
    }
    
    // Test minPurchaseLimit
    try {
      const minLimit = await contract.methods.minPurchaseLimit().call();
      console.log('✅ minPurchaseLimit():', Web3.utils.fromWei(minLimit, 'ether'), 'USDT');
    } catch (error) {
      console.log('❌ minPurchaseLimit() failed:', error.message);
    }
    
    // Test maxPurchaseLimit
    try {
      const maxLimit = await contract.methods.maxPurchaseLimit().call();
      console.log('✅ maxPurchaseLimit():', Web3.utils.fromWei(maxLimit, 'ether'), 'USDT');
    } catch (error) {
      console.log('❌ maxPurchaseLimit() failed:', error.message);
    }
    
    // Test getPurchaseInfo
    try {
      const purchaseInfo = await contract.methods.getPurchaseInfo().call();
      console.log('✅ getPurchaseInfo():', {
        minPurchase: Web3.utils.fromWei(purchaseInfo[0], 'ether'),
        maxPurchase: Web3.utils.fromWei(purchaseInfo[1], 'ether'),
        maxPerWallet: Web3.utils.fromWei(purchaseInfo[2], 'ether'),
        currentBAMPrice: purchaseInfo[3],
        bamPerUSDT: purchaseInfo[4]
      });
    } catch (error) {
      console.log('❌ getPurchaseInfo() failed:', error.message);
    }
    
    // Test walletPurchases (with test address)
    try {
      const testAddress = '0x0000000000000000000000000000000000000000';
      const purchases = await contract.methods.walletPurchases(testAddress).call();
      console.log('✅ walletPurchases(test):', purchases);
    } catch (error) {
      console.log('❌ walletPurchases() failed:', error.message);
    }
    
    // Test owner
    try {
      const owner = await contract.methods.owner().call();
      console.log('✅ owner():', owner);
      
      if (owner.toLowerCase() === '0x55ca12b29764b2cc025e2ab4c44d229e9d461cf0') {
        console.log('✅ Owner matches expected address');
      } else {
        console.log('⚠️ Owner does not match expected address');
      }
    } catch (error) {
      console.log('❌ owner() failed:', error.message);
    }
    
    console.log('🎯 Contract function testing complete');
    return true;
    
  } catch (error) {
    console.error('❌ Contract test failed:', error);
    return false;
  }
}

// Auto-run test
if (typeof window !== 'undefined') {
  testContractFunctions();
}

export default testContractFunctions;