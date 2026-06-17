// example.ts or test.ts
// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { ethers } from 'ethers';
import 'dotenv/config';
import { createEVMWallet } from '../../core/evm-wallet';

const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL!);
const wallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    evm: {
        wallet: wallet
    }
});
const walletAddress = wallet.address;

async function main() {
    try {
        // First get the swap data
    const swapData = await client.dex.getSwapData({
      chainIndex: '8453',
      fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH address
      toTokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC address
      amount: String(10 ** 18 * 0.001),
      slippagePercent: '0.005',
      userWalletAddress: walletAddress,
      fromTokenReferrerWalletAddress: walletAddress,
      feePercent: '0.001'
    });

    console.log('Got swap data:', JSON.stringify(swapData, null, 2));

    // Use the swap data to simulate the transaction
    const params = {
      chainIndex: '8453', // Base chain ID
      fromAddress: swapData.data[0].tx?.from || walletAddress,
      toAddress: swapData.data[0].tx?.to || '',
      txAmount: swapData.data[0].tx?.value || '0',
      extJson: {
        inputData: swapData.data[0].tx?.data || ''
      },
      gasPrice: swapData.data[0].tx?.gasPrice || '2734795',
      includeDebug: true
    };

    console.log('Simulating transaction...');
    const result = await client.dex.simulateTransaction(params);
    
    console.log('\nTransaction Summary:');
    console.log(`Success: ${result.success}`);
    console.log(`Gas Used: ${result.gasUsed || 'N/A'}`);
    
    if (!result.success) {
      console.log(`\n❌ Transaction would fail! Reason: ${result.error}`);
    } else {
      console.log('\n✅ Transaction would succeed!');
    }
    
    console.log('\nAsset Changes:');
    result.assetChanges.forEach(asset => {
      console.log(`${asset.direction}: ${asset.symbol} (${asset.type}) - ${asset.amount}`);
    });
    
    if (result.risks.length > 0) {
      console.log('\n⚠️ Risks Detected:');
      result.risks.forEach(risk => {
        console.log(`- ${risk.addressType}: ${risk.address}`);
      });
    }
    
    if (result.logs) {
      console.log('\nDebug Trace:');
      console.log(JSON.stringify(result.logs, null, 2));
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();