// Test the deployed BAMSwapV2 contract
import { BAMSwapV2Utils } from './bamswap-v2-utils';

export async function testDeployedContract() {
  console.log('🔍 Testing deployed BAMSwapV2 contract...');
  
  try {
    const testResult = await BAMSwapV2Utils.testContract();
    
    if (testResult.isWorking) {
      console.log('✅ Contract is working!');
      console.log('📊 Test Results:', testResult);
      
      // Update UI with real contract data
      return {
        success: true,
        bamPrice: testResult.bamPrice,
        purchaseInfo: testResult.purchaseInfo,
        message: 'Successfully connected to deployed contract'
      };
    } else {
      console.log('❌ Contract test failed:', testResult.error);
      return {
        success: false,
        error: testResult.error,
        message: 'Failed to connect to deployed contract'
      };
    }
  } catch (error) {
    console.error('❌ Contract test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Contract test encountered an error'
    };
  }
}

// Auto-run test when imported
testDeployedContract().then(result => {
  console.log('🎯 Contract Test Complete:', result.message);
});

export default testDeployedContract;