// scripts/evm-simulation.ts
import { OKXDexClient } from '../../index';
import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { createWallet } from '../../core/wallet';

dotenv.config();

async function main() {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL!);
    const wallet = createWallet(process.env.SOLANA_PRIVATE_KEY!, connection);
    const walletAddress = wallet.publicKey.toString();

    const client = new OKXDexClient({
      apiKey: process.env.OKX_API_KEY!,
      secretKey: process.env.OKX_SECRET_KEY!,
      apiPassphrase: process.env.OKX_API_PASSPHRASE!,
      projectId: process.env.OKX_PROJECT_ID!,
      solana: {
        wallet: wallet
      }
    });

    // First get the swap data
    const swapData = await client.dex.getSwapData({
      chainIndex: '501',
      fromTokenAddress: 'So11111111111111111111111111111111111111112',
      toTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: '10000000', // 0.01 SOL in lamports
      slippagePercent: '0.05',
      userWalletAddress: walletAddress,
      fromTokenReferrerWalletAddress: walletAddress,
      feePercent: '0.0001'
    });

    console.log('Got swap data:', JSON.stringify(swapData, null, 2));

    // Use the swap data to simulate the transaction
    const tx = swapData.data[0].tx;
    const routerResult = swapData.data[0].routerResult;
    if (!tx || !routerResult) {
      throw new Error('No transaction data received from swap');
    }
    const params = {
      fromAddress: tx.from,
      toAddress: tx.to,
      chainIndex: '501', // Solana chain ID,
      txAmount: routerResult.fromTokenAmount,
      extJson: {
        inputData: tx.data
      },
      gasPrice: tx.gasPrice,
      includeDebug: true
    };

    console.log('Simulating transaction...');
    // Add a 1 second delay
    const result = await client.dex.simulateTransaction(params);
    
    console.log('\nTransaction Summary:');
    console.log(`Success: ${result.success}`);
    console.log(`Gas Used: ${result.gasUsed}`);
    
    if (result.error) {
      console.log(`\n❌ Transaction would fail! Reason: ${result.error}`);
    } else {
      console.log('\n✅ Transaction would succeed!');
    }
    
    if (result.assetChanges.length > 0) {
      console.log('\nAsset Changes:');
      result.assetChanges.forEach(asset => {
        console.log(`${asset.direction}: ${asset.amount} ${asset.symbol} (${asset.type})`);
      });
    }
    
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