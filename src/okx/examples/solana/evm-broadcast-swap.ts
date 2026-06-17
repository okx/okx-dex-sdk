// example.ts or test.ts
import { OKXDexClient } from '../../index';
import { ethers } from 'ethers';
import 'dotenv/config';
import { createEVMWallet } from '../../core/evm-wallet';

// Use Base RPC URL or fallback to a public Base RPC
const baseRpcUrl = process.env.BASE_RPC_URL || process.env.EVM_RPC_URL || 'https://mainnet.base.org';
const provider = new ethers.JsonRpcProvider(baseRpcUrl);
const evmWallet = createEVMWallet(process.env.EVM_PRIVATE_KEY!, provider);

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    evm: {
        wallet: evmWallet
    }
});

const walletAddress = evmWallet.address;

async function main() {
    try {
        console.log('=== Complete Swap Workflow with Broadcast and Tracking ===');
        console.log('Wallet Address:', walletAddress);
        
        // Verify we're connected to Base network
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
        
        // if (network.chainId !== 8453) {
        //     console.warn('⚠️  Warning: Not connected to Base mainnet (8453). Current:', network.chainId);
        // }
        
        // Step 1: Get swap data
        console.log('\n1. Getting swap data...');
        const swapData = await client.dex.getSwapData({
            chainIndex: '8453', // Base mainnet
            fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
            toTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
            amount: '3000000000000000', // 0.001 ETH in wei
            slippagePercent: '0.05',
            userWalletAddress: walletAddress,
            fromTokenReferrerWalletAddress: walletAddress,
            feePercent: '0.0001'
        });

        const txData = swapData.data[0]?.tx;
        if (!txData) {
            throw new Error('No transaction data received from swap API');
        }

        console.log('✅ Swap data received');
        console.log('- From Token Amount:', swapData.data[0].routerResult.fromTokenAmount);
        console.log('- To Token Amount:', swapData.data[0].routerResult.toTokenAmount);
        console.log('- Price Impact:', swapData.data[0].routerResult.priceImpactPercent);
        console.log('- Gas Estimate:', txData.gas);

        // Step 2: Sign the transaction
        console.log('\n2. Signing transaction...');
        
        // Get current nonce
        const nonce = await provider.getTransactionCount(walletAddress);
        console.log('Current nonce:', nonce);
        
        const transaction = {
            to: txData.to,
            value: txData.value,
            data: txData.data,
            gasLimit: txData.gas,
            gasPrice: txData.gasPrice,
            maxPriorityFeePerGas: txData.maxPriorityFeePerGas || undefined,
            nonce: nonce,
            chainId: 8453 // Base mainnet chain ID
        };

        console.log('Transaction details:');
        console.log('- To:', transaction.to);
        console.log('- Value:', transaction.value);
        console.log('- Gas Limit:', transaction.gasLimit);
        console.log('- Gas Price:', transaction.gasPrice);
        console.log('- Chain ID:', transaction.chainId);

        const signedTx = await evmWallet.signTransaction(transaction);
        console.log('✅ Transaction signed');

        // Step 3: Broadcast the transaction with MEV protection
        console.log('\n3. Broadcasting transaction with MEV protection...');
        const broadcastResult = await client.dex.broadcastTransaction({
            signedTx: signedTx,
            chainIndex: '8453', // Base mainnet
            address: walletAddress,
            enableMevProtection: true // Enable MEV protection
        });

        console.log('✅ Transaction broadcasted');
        console.log('- Order ID:', broadcastResult.data[0].orderId);
        console.log('- Transaction Hash:', broadcastResult.data[0].txHash);

        // Step 4: Transaction broadcasted successfully
        const orderId = broadcastResult.data[0].orderId;
        const txHash = broadcastResult.data[0].txHash;
        
        console.log('\n✅ Swap transaction has been broadcasted successfully!');
        console.log('- Order ID:', orderId);
        console.log('- Transaction Hash:', txHash);
        console.log('- Explorer URL:', `https://web3.okx.com/explorer/base/tx/${txHash}`);
        console.log('\n📋 To track this transaction:');
        console.log(`   npx ts-node src/okx/examples/solana/evm-order-tracking.ts track ${orderId} ${walletAddress} 8453`);

    } catch (error) {
        console.error('Error in swap workflow:', error);
    }
}

main();